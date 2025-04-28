import axios from 'axios';

// API Configuration
const API_KEY = process.env.PUBG_API_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMTFmZjcyMC1mMzhmLTAxM2QtNTM5NC0wNjFhOWQ1YjYxYWYiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNzQzNzc3MjMyLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImFuYWx5cyJ9.x82GSV4WZZTcco0kAGPrCt_3M6j3wRRPzQQhvyHCnoc";
const BASE_URL = 'https://api.pubg.com/shards';

// Log API Key (truncated for security)
console.log(`[SERVER] PUBG API Key: ${API_KEY.substring(0, 20)}...`);

// Create axios instance
const pubgApiClient = axios.create({
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Accept': 'application/vnd.api+json'
  }
});

// API Functions
const pubgApi = {
  // Get player by name
  getPlayerByName: async (platform: string, playerName: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players?filter[playerNames]=${playerName}`);
    return response.data;
  },

  // Get player by ID
  getPlayerById: async (platform: string, playerId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}`);
    return response.data;
  },

  // Get player season stats
  getPlayerSeasonStats: async (platform: string, playerId: string, seasonId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}/seasons/${seasonId}`);
    return response.data;
  },

  // Get player lifetime stats
  getPlayerLifetimeStats: async (platform: string, playerId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}/seasons/lifetime`);
    return response.data;
  },

  // Get player match history
  getPlayerMatches: async (platform: string, playerId: string) => {
    const player = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}`);
    const matches = player.data.data.relationships.matches.data;
    return matches;
  },

  // Get match details
  getMatch: async (platform: string, matchId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/matches/${matchId}`);
    return response.data;
  },

  // Get telemetry data
  getTelemetry: async (telemetryUrl: string) => {
    const response = await axios.get(telemetryUrl);
    return response.data;
  },

  // Get seasons
  getSeasons: async (platform: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/seasons`);
    return response.data;
  },

  // Get leaderboards
  getLeaderboard: async (platform: string, gameMode: string, seasonId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/leaderboards/${seasonId}/${gameMode}`);
    return response.data;
  },

  // Get player weapon mastery (new)
  getPlayerWeaponMastery: async (platform: string, playerId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}/weapon_mastery`);
    return response.data;
  },

  // Get player survival mastery (new)
  getPlayerSurvivalMastery: async (platform: string, playerId: string) => {
    const response = await pubgApiClient.get(`${BASE_URL}/${platform}/players/${playerId}/survival_mastery`);
    return response.data;
  }
};

export default pubgApi;