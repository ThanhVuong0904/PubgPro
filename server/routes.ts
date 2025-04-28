import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import pubgApi from "./pubgApi";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";

  // Error handler middleware
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Search for player
  app.post(
    `${apiPrefix}/search`,
    asyncHandler(async (req, res) => {
      const searchSchema = z.object({
        playerName: z.string().min(1, "Player name is required"),
        platform: z.string().min(1, "Platform is required"),
        region: z.string().min(1, "Region is required"),
      });

      const validatedData = searchSchema.parse(req.body);

      // Save user preferences
      await storage.saveUserPreferences({
        playerName: validatedData.playerName,
        platform: validatedData.platform,
        region: validatedData.region,
        favorites: false,
      });

      // Add to search history
      await storage.addSearchHistory({
        playerName: validatedData.playerName,
        platform: validatedData.platform,
      });

      res.json({ success: true });
    }),
  );

  // Get recent searches
  app.get(
    `${apiPrefix}/recent-searches`,
    asyncHandler(async (req, res) => {
      const recentSearches = await storage.getSearchHistory(10);
      res.json(recentSearches);
    }),
  );

  // Toggle favorite status
  app.post(
    `${apiPrefix}/favorites`,
    asyncHandler(async (req, res) => {
      const favoriteSchema = z.object({
        playerName: z.string().min(1, "Player name is required"),
        favorite: z.boolean(),
      });

      const { playerName, favorite } = favoriteSchema.parse(req.body);
      const platform = req.body.platform || "steam";

      const result = await storage.updateFavoriteStatus(
        playerName,
        platform,
        favorite,
      );
      res.json({ success: true, favorite });
    }),
  );

  // Get player data
  app.get(
    `${apiPrefix}/players/:platform/:playerName`,
    asyncHandler(async (req, res) => {
      const { platform, playerName } = req.params;

      if (!playerName || !platform) {
        return res
          .status(400)
          .json({ error: "Player name and platform are required" });
      }

      const playerData = await storage.fetchPlayerData(platform, playerName);

      if (!playerData) {
        return res.status(404).json({ error: "Player not found" });
      }

      // Get user preferences to include favorite status
      const userPrefs = await storage.getUserPreferences(playerName, platform);

      res.json({
        ...playerData,
        isFavorite: userPrefs?.favorites || false,
      });
    }),
  );

  // Get player stats
  app.get(
    `${apiPrefix}/players/:platform/:playerName/stats`,
    asyncHandler(async (req, res) => {
      const { platform, playerName } = req.params;

      if (!playerName || !platform) {
        return res
          .status(400)
          .json({ error: "Player name and platform are required" });
      }

      const playerData = await storage.fetchPlayerData(platform, playerName);

      if (!playerData) {
        return res.status(404).json({ error: "Player not found" });
      }

      // Get user preferences to include favorite status
      const userPrefs = await storage.getUserPreferences(playerName, platform);

      res.json({
        ...playerData.stats,
        isFavorite: userPrefs?.favorites || false,
      });
    }),
  );

  // Get player matches
  app.get(
    `${apiPrefix}/players/:platform/:playerName/matches`,
    asyncHandler(async (req, res) => {
      const { platform, playerName } = req.params;

      if (!playerName || !platform) {
        return res
          .status(400)
          .json({ error: "Player name and platform are required" });
      }

      const playerData = await storage.fetchPlayerData(platform, playerName);

      if (!playerData) {
        return res.status(404).json({ error: "Player not found" });
      }

      const matchIds = playerData.matches.slice(0, 5); // Get first 5 matches initially
      const matchPromises = matchIds.map((matchId: string) =>
        storage.fetchMatchData(platform, matchId),
      );

      const matches = await Promise.all(matchPromises);

      // Process matches to get player-specific stats
      const playerMatches = matches
        .map((match) => {
          const playerInMatch = match.participants.find(
            (p: any) => p.name.toLowerCase() === playerName.toLowerCase(),
          );

          if (!playerInMatch) {
            return null;
          }

          return {
            id: match.id,
            map: match.map,
            gameMode: match.gameMode,
            createdAt: match.createdAt,
            placement: playerInMatch.rank,
            kills: playerInMatch.kills,
            damage: playerInMatch.damage,
            duration: Math.floor(match.duration),
            assists: playerInMatch.assists || 0,
            revives: playerInMatch.revives || 0
          };
        })
        .filter(Boolean);

      res.json(playerMatches);
    }),
  );

  // Get match data
  app.get(
    `${apiPrefix}/matches/:matchId`,
    asyncHandler(async (req, res) => {
      const { matchId } = req.params;
      const platform = (req.query.platform as string) || "steam";

      if (!matchId) {
        return res.status(400).json({ error: "Match ID is required" });
      }

      const matchData = await storage.fetchMatchData(platform, matchId);

      if (!matchData) {
        return res.status(404).json({ error: "Match not found" });
      }

      res.json(matchData);
    }),
  );

  // Get match telemetry
  app.get(
    `${apiPrefix}/matches/:matchId/telemetry`,
    asyncHandler(async (req, res) => {
      const { matchId } = req.params;
      const platform = (req.query.platform as string) || "steam";

      if (!matchId) {
        return res.status(400).json({ error: "Match ID is required" });
      }

      const telemetryData = await storage.fetchMatchTelemetry(
        platform,
        matchId,
      );

      if (!telemetryData) {
        return res.status(404).json({ error: "Telemetry data not found" });
      }

      res.json(telemetryData);
    }),
  );
  
  // Get player weapon mastery (new)
  app.get(
    `${apiPrefix}/players/:platform/:playerName/weapon_mastery`, 
    asyncHandler(async (req, res) => {
      const { platform, playerName } = req.params;
      
      if (!platform || !playerName) {
        return res.status(400).json({ error: "Platform and player name are required" });
      }
      
      try {
        // Get player ID first
        const playerData = await pubgApi.getPlayerByName(platform, playerName);
        if (!playerData.data || playerData.data.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        
        const playerId = playerData.data[0].id;
        const weaponMasteryData = await pubgApi.getPlayerWeaponMastery(platform, playerId);
        
        res.json(weaponMasteryData);
      } catch (error: any) {
        console.error("Error fetching weapon mastery:", error.message);
        res.status(500).json({ error: "Failed to retrieve weapon mastery data" });
      }
    })
  );
  
  // Get player survival mastery (new)
  app.get(
    `${apiPrefix}/players/:platform/:playerName/survival_mastery`, 
    asyncHandler(async (req, res) => {
      const { platform, playerName } = req.params;
      
      if (!platform || !playerName) {
        return res.status(400).json({ error: "Platform and player name are required" });
      }
      
      try {
        // Get player ID first
        const playerData = await pubgApi.getPlayerByName(platform, playerName);
        if (!playerData.data || playerData.data.length === 0) {
          return res.status(404).json({ error: "Player not found" });
        }
        
        const playerId = playerData.data[0].id;
        const survivalMasteryData = await pubgApi.getPlayerSurvivalMastery(platform, playerId);
        
        res.json(survivalMasteryData);
      } catch (error: any) {
        console.error("Error fetching survival mastery:", error.message);
        res.status(500).json({ error: "Failed to retrieve survival mastery data" });
      }
    })
  );

  const httpServer = createServer(app);

  return httpServer;
}
