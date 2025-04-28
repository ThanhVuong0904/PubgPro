import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if we have existing data
    const existingPreferences = await db.query.userPreferences.findMany();
    const existingSearches = await db.query.searchHistory.findMany();

    if (existingPreferences.length > 0 || existingSearches.length > 0) {
      console.log("Database already contains data, skipping seed");
      return;
    }

    // Seed sample user preferences
    const userPreferencesData = [
      {
        playerName: "shroud",
        platform: "steam",
        region: "pc-na",
        favorites: true,
        lastSearched: new Date()
      },
      {
        playerName: "chocotaco",
        platform: "steam",
        region: "pc-na",
        favorites: true,
        lastSearched: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        playerName: "TGLTN",
        platform: "steam", 
        region: "pc-eu",
        favorites: false,
        lastSearched: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      }
    ];

    await db.insert(schema.userPreferences).values(userPreferencesData);
    console.log(`Inserted ${userPreferencesData.length} user preferences`);

    // Seed sample search history
    const searchHistoryData = [
      {
        playerName: "shroud",
        platform: "steam",
        timestamp: new Date()
      },
      {
        playerName: "chocotaco",
        platform: "steam",
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        playerName: "TGLTN",
        platform: "steam",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        playerName: "Kaymind",
        platform: "steam", 
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      },
      {
        playerName: "HwinnTTV",
        platform: "steam",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
      }
    ];

    await db.insert(schema.searchHistory).values(searchHistoryData);
    console.log(`Inserted ${searchHistoryData.length} search history entries`);

    console.log("Database seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
