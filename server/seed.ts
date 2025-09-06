import { db } from "./db";
import { discordMembers, kickLogs, serverStats, blockedWords } from "@shared/schema";
import databaseData from "../database.json";

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await db.delete(kickLogs);
    await db.delete(discordMembers);
    await db.delete(blockedWords);
    await db.delete(serverStats);

    // Seed blocked words
    console.log("📝 Seeding blocked words...");
    for (const word of databaseData.blockedWords) {
      await db.insert(blockedWords).values(word);
    }
    console.log(`✅ Seeded ${databaseData.blockedWords.length} blocked words`);

    // Seed Discord members
    console.log("👥 Seeding Discord members...");
    for (const member of databaseData.discordMembers) {
      await db.insert(discordMembers).values({
        ...member,
        joinedServerAt: new Date(member.joinedServerAt),
        joinedDiscordAt: member.joinedDiscordAt ? new Date(member.joinedDiscordAt) : null,
        joinedAt: new Date(),
        lastSeen: new Date()
      });
    }
    console.log(`✅ Seeded ${databaseData.discordMembers.length} Discord members`);

    // Seed kicked members (for foreign key references)
    console.log("🚫 Seeding kicked members...");
    for (const member of databaseData.kickedMembers) {
      await db.insert(discordMembers).values({
        ...member,
        joinedServerAt: new Date(member.joinedServerAt),
        joinedDiscordAt: member.joinedDiscordAt ? new Date(member.joinedDiscordAt) : null,
        joinedAt: new Date(),
        lastSeen: new Date()
      });
    }
    console.log(`✅ Seeded ${databaseData.kickedMembers.length} kicked members`);

    // Seed kick logs
    console.log("🥾 Seeding kick logs...");
    for (const log of databaseData.kickLogs) {
      await db.insert(kickLogs).values({
        ...log,
        kickedAt: new Date(log.kickedAt)
      });
    }
    console.log(`✅ Seeded ${databaseData.kickLogs.length} kick logs`);

    // Seed server stats
    console.log("📊 Seeding server stats...");
    await db.insert(serverStats).values({
      ...databaseData.serverStats,
      lastUpdated: new Date(databaseData.serverStats.lastUpdated)
    });
    console.log("✅ Seeded server stats");

    console.log("🎉 Database seeding completed successfully!");

    // Display summary
    const membersCount = await db.select().from(discordMembers);
    const wordsCount = await db.select().from(blockedWords);
    const kicksCount = await db.select().from(kickLogs);
    
    console.log("\n📊 Database Summary:");
    console.log(`👥 Members: ${membersCount.length}`);
    console.log(`🚫 Blocked Words: ${wordsCount.length}`);
    console.log(`🥾 Kick Logs: ${kicksCount.length}`);
    console.log(`📈 Server Stats: Ready`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("🏁 Seeding script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };