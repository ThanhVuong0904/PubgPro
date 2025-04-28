import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User preferences for the application
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  platform: text("platform").notNull().default("steam"),
  region: text("region").notNull().default("pc-na"),
  favorites: boolean("favorites").notNull().default(false),
  lastSearched: timestamp("last_searched").defaultNow().notNull(),
});

// Recently searched players
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  platform: text("platform").notNull().default("steam"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Match data cache to reduce API calls
export const matchCache = pgTable("match_cache", {
  id: serial("id").primaryKey(),
  matchId: text("match_id").notNull().unique(),
  matchData: jsonb("match_data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Player data cache to reduce API calls
export const playerCache = pgTable("player_cache", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  playerId: text("player_id").notNull().unique(),
  platform: text("platform").notNull().default("steam"),
  playerData: jsonb("player_data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const userPreferencesRelations = relations(userPreferences, ({ many }) => ({
  searchHistory: many(searchHistory),
}));

// Define schemas for validation
export const userPreferencesInsertSchema = createInsertSchema(userPreferences, {
  playerName: (schema) => schema.min(1, "Player name is required"),
  platform: (schema) => schema.min(1, "Platform is required"),
  region: (schema) => schema.min(1, "Region is required"),
});

export const searchHistoryInsertSchema = createInsertSchema(searchHistory, {
  playerName: (schema) => schema.min(1, "Player name is required"),
  platform: (schema) => schema.min(1, "Platform is required"),
});

export const matchCacheInsertSchema = createInsertSchema(matchCache, {
  matchId: (schema) => schema.min(1, "Match ID is required"),
});

export const playerCacheInsertSchema = createInsertSchema(playerCache, {
  playerName: (schema) => schema.min(1, "Player name is required"),
  playerId: (schema) => schema.min(1, "Player ID is required"),
  platform: (schema) => schema.min(1, "Platform is required"),
});

// Export types
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof userPreferencesInsertSchema>;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof searchHistoryInsertSchema>;

export type MatchCache = typeof matchCache.$inferSelect;
export type InsertMatchCache = z.infer<typeof matchCacheInsertSchema>;

export type PlayerCache = typeof playerCache.$inferSelect;
export type InsertPlayerCache = z.infer<typeof playerCacheInsertSchema>;
