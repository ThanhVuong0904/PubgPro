import { db } from '@db';
import {
    userPreferences,
    searchHistory,
    matchCache,
    playerCache,
    userPreferencesInsertSchema,
    searchHistoryInsertSchema,
    matchCacheInsertSchema,
    playerCacheInsertSchema,
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import pubgApi from './pubgApi';
import { z } from 'zod';

// Cache expiration duration (1 hour in milliseconds)
const CACHE_EXPIRATION = 60 * 60 * 1000;
// const CACHE_EXPIRATION = 1;

export const storage = {
    // User preferences
    getUserPreferences: async (playerName: string, platform: string) => {
        return await db.query.userPreferences.findFirst({
            where: and(
                eq(userPreferences.playerName, playerName),
                eq(userPreferences.platform, platform),
            ),
        });
    },

    saveUserPreferences: async (
        data: z.infer<typeof userPreferencesInsertSchema>,
    ) => {
        const validatedData = userPreferencesInsertSchema.parse(data);

        const existing = await db.query.userPreferences.findFirst({
            where: and(
                eq(userPreferences.playerName, validatedData.playerName),
                eq(userPreferences.platform, validatedData.platform),
            ),
        });

        if (existing) {
            return await db
                .update(userPreferences)
                .set({
                    region: validatedData.region,
                    favorites: validatedData.favorites,
                    lastSearched: new Date(),
                })
                .where(eq(userPreferences.id, existing.id))
                .returning();
        } else {
            return await db
                .insert(userPreferences)
                .values(validatedData)
                .returning();
        }
    },

    updateFavoriteStatus: async (
        playerName: string,
        platform: string,
        favorite: boolean,
    ) => {
        const existing = await db.query.userPreferences.findFirst({
            where: and(
                eq(userPreferences.playerName, playerName),
                eq(userPreferences.platform, platform),
            ),
        });

        if (existing) {
            return await db
                .update(userPreferences)
                .set({
                    favorites: favorite,
                    lastSearched: new Date(),
                })
                .where(eq(userPreferences.id, existing.id))
                .returning();
        } else {
            return await db
                .insert(userPreferences)
                .values({
                    playerName,
                    platform,
                    region: 'pc-na', // Default region
                    favorites: favorite,
                    lastSearched: new Date(),
                })
                .returning();
        }
    },

    // Search history
    getSearchHistory: async (limit = 10) => {
        return await db.query.searchHistory.findMany({
            orderBy: [desc(searchHistory.timestamp)],
            limit,
        });
    },

    addSearchHistory: async (
        data: z.infer<typeof searchHistoryInsertSchema>,
    ) => {
        const validatedData = searchHistoryInsertSchema.parse(data);

        return await db.insert(searchHistory).values(validatedData).returning();
    },

    // Match cache
    getMatchFromCache: async (matchId: string) => {
        const cachedMatch = await db.query.matchCache.findFirst({
            where: eq(matchCache.matchId, matchId),
        });

        if (cachedMatch && new Date(cachedMatch.expiresAt) > new Date()) {
            return cachedMatch.matchData;
        }

        return null;
    },

    saveMatchToCache: async (matchId: string, matchData: any) => {
        const validatedData = matchCacheInsertSchema.parse({
            matchId,
            matchData,
            expiresAt: new Date(Date.now() + CACHE_EXPIRATION),
        });

        const existing = await db.query.matchCache.findFirst({
            where: eq(matchCache.matchId, matchId),
        });

        if (existing) {
            return await db
                .update(matchCache)
                .set({
                    matchData: validatedData.matchData,
                    expiresAt: validatedData.expiresAt,
                    createdAt: new Date(),
                })
                .where(eq(matchCache.id, existing.id))
                .returning();
        } else {
            return await db
                .insert(matchCache)
                .values(validatedData)
                .returning();
        }
    },

    // Player cache
    getPlayerFromCache: async (playerId: string) => {
        const cachedPlayer = await db.query.playerCache.findFirst({
            where: eq(playerCache.playerId, playerId),
        });

        if (cachedPlayer && new Date(cachedPlayer.expiresAt) > new Date()) {
            return cachedPlayer.playerData;
        }

        return null;
    },

    savePlayerToCache: async (
        playerName: string,
        playerId: string,
        platform: string,
        playerData: any,
    ) => {
        const validatedData = playerCacheInsertSchema.parse({
            playerName,
            playerId,
            platform,
            playerData,
            expiresAt: new Date(Date.now() + CACHE_EXPIRATION),
        });

        const existing = await db.query.playerCache.findFirst({
            where: eq(playerCache.playerId, playerId),
        });

        if (existing) {
            return await db
                .update(playerCache)
                .set({
                    playerData: validatedData.playerData,
                    expiresAt: validatedData.expiresAt,
                    createdAt: new Date(),
                })
                .where(eq(playerCache.id, existing.id))
                .returning();
        } else {
            return await db
                .insert(playerCache)
                .values(validatedData)
                .returning();
        }
    },

    // Fetch and process PUBG API data
    fetchPlayerData: async (platform: string, playerName: string) => {
        try {
            const playerResponse = await pubgApi.getPlayerByName(
                platform,
                playerName,
            );

            if (!playerResponse.data || playerResponse.data.length === 0) {
                throw new Error(`Player not found: ${playerName}`);
            }

            const player = playerResponse.data[0];
            const playerId = player.id;

            // Save search history
            await storage.addSearchHistory({
                playerName,
                platform,
                timestamp: new Date(),
            });

            // Check if player is in cache
            const cachedPlayer = await storage.getPlayerFromCache(playerId);
            if (cachedPlayer) {
                return cachedPlayer;
            }

            // Get lifetime stats
            const lifetimeStats = await pubgApi.getPlayerLifetimeStats(
                platform,
                playerId,
            );

            // Get survival mastery data
            let survivalMastery = null;
            try {
                survivalMastery = await pubgApi.getPlayerSurvivalMastery(
                    platform,
                    playerId,
                );
            } catch (error) {
                console.error(
                    `Error fetching survival mastery for ${playerName}:`,
                    error,
                );
            }

            // Get weapon mastery data
            let weaponMastery = null;
            try {
                weaponMastery = await pubgApi.getPlayerWeaponMastery(
                    platform,
                    playerId,
                );
            } catch (error) {
                console.error(
                    `Error fetching weapon mastery for ${playerName}:`,
                    error,
                );
            }

            // Get recent matches for map distribution
            const recentMatchIds = getRecentMatches(player);

            // Get match details for map usage statistics
            let matchDetails = [];
            try {
                // Get first few matches for map statistics
                const matchPromises = recentMatchIds
                    // .slice(0, 5)
                    .map((matchId) =>
                        pubgApi
                            .getMatch(platform, matchId)
                            .then((response) => {
                                if (
                                    response &&
                                    response.data &&
                                    response.data.attributes
                                ) {
                                    let included = response.included;
                                    let participant = included.find(
                                        (p: any) =>
                                            p.type === 'participant' &&
                                            p.attributes.stats.playerId ===
                                                playerId,
                                    );
                                    return {
                                        map: response.data.attributes.mapName,
                                        createdAt:
                                            response.data.attributes.createdAt,
                                        stats: participant?.attributes?.stats,
                                    };
                                }
                                return null;
                            })
                            .catch((error) => {
                                console.error(
                                    `Error fetching match ${matchId}:`,
                                    error,
                                );
                                return null;
                            }),
                    );

                matchDetails = (await Promise.all(matchPromises)).filter(
                    Boolean,
                );
            } catch (error) {
                console.error(
                    'Error fetching match details for map statistics:',
                    error,
                );
            }

            // Process player data
            const processedPlayerData = {
                id: playerId,
                name: playerName,
                platform,
                stats: processPlayerStats(
                    lifetimeStats,
                    true,
                    survivalMastery,
                    weaponMastery,
                    matchDetails,
                ),
                matches: recentMatchIds,
            };

            // Cache player data
            await storage.savePlayerToCache(
                playerName,
                playerId,
                platform,
                processedPlayerData,
            );

            return processedPlayerData;
        } catch (error) {
            console.error('Error fetching player data:', error);
            throw error;
        }
    },

    fetchMatchData: async (platform: string, matchId: string) => {
        try {
            // Check if match is in cache
            const cachedMatch = await storage.getMatchFromCache(matchId);
            if (cachedMatch) {
                return cachedMatch;
            }

            // Fetch match data from API
            const matchResponse = await pubgApi.getMatch(platform, matchId);

            // Process match data
            const processedMatchData = processMatchData(matchResponse);

            // Cache match data
            await storage.saveMatchToCache(matchId, processedMatchData);

            return processedMatchData;
        } catch (error) {
            console.error('Error fetching match data:', error);
            throw error;
        }
    },

    fetchMatchTelemetry: async (platform: string, matchId: string) => {
        try {
            // First get match data
            const matchData = await storage.fetchMatchData(platform, matchId);

            console.log(
                'Match data for telemetry:',
                JSON.stringify(matchData, null, 2).substring(0, 500) + '...',
            );

            // Find telemetry URL - check all assets for a URL
            let telemetryUrl = '';
            let mapName = 'Unknown';
            let matchDuration = 1800;

            // Extract known data
            if (typeof matchData === 'object' && matchData !== null) {
                // Extract map name and duration
                if ('map' in matchData) {
                    mapName = matchData.map as string;
                }

                if ('duration' in matchData) {
                    matchDuration = matchData.duration as number;
                }

                // First check if telemetryUrl is directly available
                if ('telemetryUrl' in matchData && matchData.telemetryUrl) {
                    console.log(
                        'Using telemetryUrl directly:',
                        matchData.telemetryUrl,
                    );
                    telemetryUrl = matchData.telemetryUrl as string;
                }
                // Then check if we have assets with URLs
                else if (
                    'assets' in matchData &&
                    Array.isArray(matchData.assets) &&
                    matchData.assets.length > 0
                ) {
                    const assetWithUrl = matchData.assets.find(
                        (asset: any) =>
                            asset &&
                            typeof asset === 'object' &&
                            'url' in asset &&
                            typeof asset.url === 'string' &&
                            asset.url.includes('telemetry'),
                    );

                    if (assetWithUrl && 'url' in assetWithUrl) {
                        console.log(
                            'Found telemetry URL in assets:',
                            assetWithUrl.url,
                        );
                        telemetryUrl = assetWithUrl.url as string;
                    }
                }
            }

            if (!telemetryUrl) {
                console.error('No telemetry URL found in match data');

                // Return empty data structure with available information
                return {
                    playerPositions: [],
                    playerAttacks: [],
                    playerKills: [],
                    redZones: [],
                    playZones: [],
                    map: mapName,
                    duration: matchDuration,
                };
            }

            // Fetch telemetry data from URL
            const telemetryData = await pubgApi.getTelemetry(telemetryUrl);

            // Process telemetry data for visualization
            return processTelemetryData(telemetryData);
        } catch (error) {
            console.error('Error fetching match telemetry:', error);

            // Return empty data structure
            return {
                playerPositions: [],
                playerAttacks: [],
                playerKills: [],
                redZones: [],
                playZones: [],
                map: 'Unknown',
                duration: 1800,
            };
        }
    },
};

// Helper functions
function processPlayerStats(
    lifetimeStats: any,
    isLifeTime: boolean,
    survivalMastery?: any,
    weaponMastery?: any,
    matchDetails?: any[],
) {
    // Extract and format player stats from PUBG API response
    const gameModeStats = lifetimeStats.data.attributes.gameModeStats;

    // Combine stats across game modes
    const combinedStats = {
        kills: 0,
        losses: 0,
        wins: 0,
        damageDealt: 0,
        headshotKills: 0,
        longestKill: 0,
        totalGames: 0,
        top10s: 0,
        mostPlayed: '',
    };

    let maxGames = 0;

    for (const mode in gameModeStats) {
        const stats = gameModeStats[mode];
        combinedStats.kills += stats.kills;
        combinedStats.losses += stats.losses;
        combinedStats.wins += stats.wins;
        combinedStats.damageDealt += stats.damageDealt;
        combinedStats.headshotKills += stats.headshotKills;
        combinedStats.longestKill = Math.max(
            combinedStats.longestKill,
            stats.longestKill,
        );
        combinedStats.totalGames += stats.roundsPlayed;
        combinedStats.top10s += stats.top10s;

        // Track the most played game mode
        if (stats.roundsPlayed > maxGames) {
            maxGames = stats.roundsPlayed;
            combinedStats.mostPlayed = mode;
        }
    }

    // Calculate derived stats
    const kd =
        combinedStats.totalGames > 0
            ? (
                  combinedStats.kills /
                  (combinedStats.totalGames - combinedStats.wins)
              ).toFixed(2)
            : '0';

    const winRate =
        combinedStats.totalGames > 0
            ? ((combinedStats.wins / combinedStats.totalGames) * 100).toFixed(
                  1,
              ) + '%'
            : '0%';

    const avgDamage =
        combinedStats.totalGames > 0
            ? Math.round(combinedStats.damageDealt / combinedStats.totalGames)
            : 0;

    const headshotRate =
        combinedStats.kills > 0
            ? (
                  (combinedStats.headshotKills / combinedStats.kills) *
                  100
              ).toFixed(1) + '%'
            : '0%';

    const top10Rate =
        combinedStats.totalGames > 0
            ? ((combinedStats.top10s / combinedStats.totalGames) * 100).toFixed(
                  1,
              ) + '%'
            : '0%';

    // PUBG API không cung cấp chi tiết về vũ khí trực tiếp
    // Trả về mảng trống thay vì sử dụng dữ liệu giả mạo
    const weapons: any[] = [];

    // Tên bản đồ dựa trên PUBG API github repo: https://github.com/pubg/api-assets/
    const mapCodeToName: Record<string, string> = {
        Baltic_Main: 'Erangel (Remastered)',
        Chimera_Main: 'Paramo',
        Desert_Main: 'Miramar',
        DihorOtok_Main: 'Vikendi',
        Erangel_Main: 'Erangel',
        Heaven_Main: 'Haven',
        Kiki_Main: 'Deston',
        Range_Main: 'Camp Jackal',
        Savage_Main: 'Sanhok',
        Summerland_Main: 'Karakin',
        Tiger_Main: 'Taego',
        Neon_Main: 'Rondo',
    };

    // Xử lý dữ liệu bản đồ từ lịch sử trận đấu
    const maps: any[] = [];

    // Tạo thống kê bản đồ từ dữ liệu trận đấu gần đây nếu có
    if (matchDetails && matchDetails.length > 0) {
        // Đếm số lần xuất hiện của mỗi bản đồ
        const mapCounts: Record<string, number> = {};
        const mapStats: Record<
            string,
            {
                totalKills: number;
                totalDeaths: number;
                totalWins: number;
                totalRank: number;
                totalMatches: number;
            }
        > = {};

        matchDetails.forEach((match) => {
            const mapName = mapCodeToName[match.map] || match.map;

            // Đếm số lần xuất hiện của mỗi bản đồ
            mapCounts[mapName] = (mapCounts[mapName] || 0) + 1;

            // Cập nhật thông tin cho mỗi bản đồ
            if (!mapStats[mapName]) {
                mapStats[mapName] = {
                    totalKills: 0,
                    totalDeaths: 0,
                    totalWins: 0,
                    totalRank: 0,
                    totalMatches: 0,
                };
            }

            const stats = match.stats;
            mapStats[mapName].totalKills += stats.kills;
            if (stats.winPlace !== 1) {
                mapStats[mapName].totalDeaths++;
            }
            if (stats.winPlace === 1) {
                mapStats[mapName].totalWins++;
            }
            mapStats[mapName].totalRank += stats.winPlace;
            mapStats[mapName].totalMatches++;
        });

        // Tạo thông tin bản đồ với các chỉ số tính toán cho từng bản đồ
        for (const mapName in mapCounts) {
            const stats = mapStats[mapName];

            // Tính toán K/D cho mỗi bản đồ
            const kd =
                stats.totalDeaths > 0
                    ? (stats.totalKills / stats.totalDeaths).toFixed(2)
                    : stats.totalKills > 0
                    ? stats.totalKills
                    : 0;

            // Tính toán Avg Rank cho mỗi bản đồ
            const avgRank =
                stats.totalMatches > 0
                    ? (stats.totalRank / stats.totalMatches).toFixed(2)
                    : 0;

            // Thêm thông tin vào maps
            maps.push({
                name: mapName,
                count: mapCounts[mapName],
                percentage:
                    ((mapCounts[mapName] / matchDetails.length) * 100).toFixed(
                        1,
                    ) + '%',
                matches: stats.totalMatches, // Tổng số trận đấu
                kd: kd, // Tỉ lệ K/D
                wins: stats.totalWins, // Số lần thắng
                avgRank: avgRank, // Xếp hạng trung bình
            });
        }

        // Sắp xếp theo số lần xuất hiện của bản đồ giảm dần
        maps.sort((a, b) => b.count - a.count);
    }

    // Format the game mode string nicely
    let gameMode = combinedStats.mostPlayed;
    if (gameMode) {
        gameMode = gameMode
            .replace('solo', 'Solo')
            .replace('duo', 'Duo')
            .replace('squad', 'Squad')
            .replace('-fpp', ' FPP')
            .replace('fpp', ' FPP');
    } else {
        gameMode = 'Squad FPP';
    }

    // Process weapon mastery data if available
    if (weaponMastery && weaponMastery.data && weaponMastery.data.attributes) {
        const weaponStats = weaponMastery.data.attributes.weaponSummaries;

        // Extract top weapons by XP
        if (weaponStats) {
            for (const weaponId in weaponStats) {
                const weapon = weaponStats[weaponId];
                let mostDefeatsInAGame = Math.max(
                    weapon.StatsTotal?.MostDefeatsInAGame,
                    weapon.OfficialStatsTotal?.MostDefeatsInAGame,
                    weapon.CompetitiveStatsTotal?.MostDefeatsInAGame,
                );
                let totalKills = sum(
                    weapon.StatsTotal?.Kills,
                    weapon.OfficialStatsTotal?.Kills,
                    weapon.CompetitiveStatsTotal?.Kills,
                );
                let totalDamagePlayer = sum(
                    weapon.StatsTotal?.DamagePlayer,
                    weapon.OfficialStatsTotal?.DamagePlayer,
                    weapon.CompetitiveStatsTotal?.DamagePlayer,
                );
                let totalHeadshots = sum(
                    weapon.StatsTotal?.HeadShots,
                    weapon.OfficialStatsTotal?.HeadShots,
                    weapon.CompetitiveStatsTotal?.HeadShots,
                );

                let totalGroggies = sum(
                    weapon.StatsTotal?.Groggies,
                    weapon.OfficialStatsTotal?.Groggies,
                    weapon.CompetitiveStatsTotal?.Groggies,
                );

                if (weapon) {
                    weapons.push({
                        id: weaponId,
                        name: weaponId.replace('Item_Weapon_', ''),
                        xp: weapon.XPTotal || 0,
                        levelCurrent: weapon.LevelCurrent || 0,
                        kills: totalKills,
                        mostDefeatsInAGame: mostDefeatsInAGame,
                        damagePlayer: totalDamagePlayer,
                        headshots: totalHeadshots,
                        groggies: totalGroggies,
                        usage: Math.round(
                            (totalKills / combinedStats.kills) * 100,
                        ),
                    });
                }
            }

            // Sort weapons by kills to get the most used ones
            weapons.sort((a, b) => b.kills - a.kills);

            // Limit to top weapons
            weapons.splice(5);
        }
    }

    // Process survival mastery data if available
    let playerLevel = '';
    let lastActiveTime = '';

    if (
        survivalMastery &&
        survivalMastery.data &&
        survivalMastery.data.attributes
    ) {
        const survivalStats = survivalMastery.data.attributes;

        // Get player level
        if (survivalStats.level) {
            playerLevel = `${survivalStats.level}`;
        }

        // Get last active timestamp if available
        if (survivalStats.lastMatchDate) {
            try {
                const lastActiveDate = new Date(survivalStats.lastMatchDate);
                lastActiveTime = lastActiveDate.toLocaleDateString();
            } catch (error) {
                console.error('Error parsing last active date:', error);
            }
        }
    }

    return {
        kills: combinedStats.kills,
        kd,
        wins: combinedStats.wins,
        winRate,
        top10Rate,
        avgDamage,
        headshotRate,
        longestKill: Math.round(combinedStats.longestKill) + 'm',
        totalMatches: combinedStats.totalGames,
        weapons,
        maps,
        level: playerLevel,
        lastActive: lastActiveTime,
        season: isLifeTime ? 'All Time' : 'Current Season',
        gameMode,
    };
}

function getRecentMatches(player: any) {
    // Extract recent matches from player data
    const recentMatches = player.relationships.matches.data.slice(0, 10);
    return recentMatches.map((match: any) => match.id);
}

function processMatchData(matchResponse: any) {
    const matchData = matchResponse.data;
    const included = matchResponse.included;

    // Extract participants
    const participants = included.filter(
        (item: any) => item.type === 'participant',
    );

    // Extract rosters (teams)
    const rosters = included.filter((item: any) => item.type === 'roster');

    // Extract assets (telemetry)
    const assets = included.filter((item: any) => item.type === 'asset');

    // Find telemetry URL
    let telemetryUrl = '';
    if (assets.length > 0) {
        const asset = assets.find(
            (a: any) => a.attributes?.URL || a.attributes?.url,
        );
        telemetryUrl = asset?.attributes?.URL || asset?.attributes?.url || '';
    }

    // Process into simplified format
    return {
        id: matchData.id,
        map: matchData.attributes.mapName,
        createdAt: matchData.attributes.createdAt,
        duration: matchData.attributes.duration,
        gameMode: matchData.attributes.gameMode,
        playerCount: participants.length,
        participants: participants.map((p: any) => ({
            id: p.id,
            name: p.attributes.stats.name,
            kills: p.attributes.stats.kills,
            damage: Math.round(p.attributes.stats.damageDealt),
            assists: p.attributes.stats.assists || 0,
            revives: p.attributes.stats.revives || 0,
            rank: p.attributes.stats.winPlace,
            teamId: rosters.find((r: any) =>
                r.relationships.participants.data.some(
                    (rp: any) => rp.id === p.id,
                ),
            )?.attributes.stats.teamId,
            platform: matchData.attributes.shardId,
            playerId: p.attributes.stats.playerId,
        })),
        assets: assets.map((a: any) => ({
            id: a.id,
            type: a.type,
            url: a.attributes?.URL || a.attributes?.url || '',
        })),
        telemetryUrl,
    };
}

function processTelemetryData(telemetryData: any) {
    // Ensure telemetryData is an array
    if (!Array.isArray(telemetryData)) {
        console.error(
            'Invalid telemetry data format, expected array:',
            typeof telemetryData,
        );
        return {
            playerPositions: [],
            playerAttacks: [],
            playerKills: [],
            redZones: [],
            playZones: [],
        };
    }

    try {
        // Filter relevant events
        const positionEvents = telemetryData.filter(
            (event: any) => event && event._T === 'LogPlayerPosition',
        );

        const attackEvents = telemetryData.filter(
            (event: any) => event && event._T === 'LogPlayerAttack',
        );

        const killEvents = telemetryData.filter(
            (event: any) => event && event._T === 'LogPlayerKillV2',
        );

        // Zone events
        const playZoneEvents = telemetryData.filter(
            (event: any) =>
                event &&
                event._T &&
                (event._T === 'LogGameStatePeriodic' ||
                    event._T === 'LogPhaseChange'),
        );

        const redZoneEvents = telemetryData.filter(
            (event: any) => event && event._T === 'LogRedZoneEnded',
        );

        // Process events into visualization-friendly format
        return {
            playerPositions: positionEvents
                .filter(
                    (event: any) =>
                        event &&
                        event.character &&
                        event.character.name &&
                        event.character.location,
                )
                .map((event: any) => ({
                    playerName: event.character.name,
                    teamId: event.character.teamId,
                    position: {
                        x: event.character.location.x,
                        y: event.character.location.y,
                    },
                    timestamp: event.elapsedTime,
                })),

            playerAttacks: attackEvents
                .filter(
                    (event: any) =>
                        event &&
                        event.attacker &&
                        event.attacker.name &&
                        event.attacker.teamId &&
                        event.attacker.location,
                )
                .map((event: any) => ({
                    attackerName: event.attacker.name,
                    attackerTeamId: event.attacker.teamId,
                    attackerPosition: {
                        x: event.attacker.location.x,
                        y: event.attacker.location.y,
                    },
                    weaponName: event.weapon?.itemId || 'Unknown',
                    timestamp: event.elapsedTime,
                })),

            playerKills: killEvents
                .filter(
                    (event: any) =>
                        event &&
                        event.killer &&
                        event.killer.name &&
                        event.killer.teamId &&
                        event.killer.location &&
                        event.victim &&
                        event.victim.name &&
                        event.victim.teamId &&
                        event.victim.location,
                )
                .map((event: any) => ({
                    killerName: event.killer.name,
                    killerTeamId: event.killer.teamId,
                    killerPosition: {
                        x: event.killer.location.x,
                        y: event.killer.location.y,
                    },
                    victimName: event.victim.name,
                    victimTeamId: event.victim.teamId,
                    victimPosition: {
                        x: event.victim.location.x,
                        y: event.victim.location.y,
                    },
                    weapon: event.damageCauserName || 'Unknown',
                    distance: event.distance || 0,
                    timestamp: event.elapsedTime,
                })),

            playZones: playZoneEvents
                .filter(
                    (event: any) =>
                        event &&
                        event.gameState &&
                        event.gameState.safetyZonePosition,
                )
                .map((event: any) => ({
                    position: {
                        x: event.gameState.safetyZonePosition.x,
                        y: event.gameState.safetyZonePosition.y,
                    },
                    radius: event.gameState.safetyZoneRadius,
                    timestamp: event.elapsedTime,
                })),

            redZones: redZoneEvents
                .filter((event: any) => event && event.zonePosition)
                .map((event: any) => ({
                    position: {
                        x: event.zonePosition.x,
                        y: event.zonePosition.y,
                    },
                    radius: event.zoneRadius || 50,
                    timestamp: event.elapsedTime,
                })),
        };
    } catch (error) {
        console.error('Error processing telemetry data:', error);
        return {
            playerPositions: [],
            playerAttacks: [],
            playerKills: [],
            redZones: [],
            playZones: [],
        };
    }
}

function sum(...args: any[]) {
    return args.reduce((a, b) => a + b, 0);
}

export default storage;
