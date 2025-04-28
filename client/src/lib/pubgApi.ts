import axios from 'axios';

// API Configuration - in frontend, we don't use direct API calls to PUBG API
// All calls to PUBG API should go through our backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance for our backend API
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Setup response and request interceptors for logging
apiClient.interceptors.request.use(
  config => {
    console.log(`API Query Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error(`API Query Request Error:`, error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    console.log(`API Query Response (${response.config.url ? Date.now() - new Date(response.config.headers['X-Request-Time'] || Date.now()).getTime() : 0}ms): ${response.config.method?.toUpperCase()} ${response.config.url}`, response);
    return response;
  },
  error => {
    console.error(`API Query Response Error:`, error);
    return Promise.reject(error);
  }
);

// API Functions
export const pubgApi = {
  // Get player stats and info
  getPlayerStats: async (platform: string, playerName: string) => {
    const response = await apiClient.get(`/player/${platform}/${playerName}`);
    return response.data;
  },

  // Get player matches
  getPlayerMatches: async (platform: string, playerName: string) => {
    const response = await apiClient.get(`/player/${platform}/${playerName}/matches`);
    return response.data;
  },

  // Get match details
  getMatch: async (platform: string, matchId: string) => {
    const response = await apiClient.get(`/match/${platform}/${matchId}`);
    return response.data;
  },

  // Get match telemetry (match replay data)
  getMatchTelemetry: async (platform: string, matchId: string) => {
    const response = await apiClient.get(`/match/${platform}/${matchId}/telemetry`);
    return response.data;
  },

  // Get recent searches
  getRecentSearches: async () => {
    const response = await apiClient.get(`/recent-searches`);
    return response.data;
  },

  // Get seasons 
  getSeasons: async (platform: string) => {
    const response = await apiClient.get(`/seasons/${platform}`);
    return response.data;
  },
  
  // Get weapon mastery data (new)
  getPlayerWeaponMastery: async (platform: string, playerName: string) => {
    const response = await apiClient.get(`/players/${platform}/${playerName}/weapon_mastery`);
    return response.data;
  },
  
  // Get survival mastery data (new)
  getPlayerSurvivalMastery: async (platform: string, playerName: string) => {
    const response = await apiClient.get(`/players/${platform}/${playerName}/survival_mastery`);
    return response.data;
  },
};

export default pubgApi;
