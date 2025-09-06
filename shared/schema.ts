import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const discordMembers = pgTable("discord_members", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  status: text("status").notNull().default("offline"), // online, idle, dnd, offline
  role: text("role").notNull().default("Member"), // Member, Moderator, Admin
  roles: text("roles").array().notNull().default(sql`ARRAY[]::text[]`), // Array of role IDs
  cash: integer("cash").notNull().default(0),
  joinedServerAt: timestamp("joined_server_at").defaultNow(),
  joinedDiscordAt: timestamp("joined_discord_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow()
});

export const kickLogs = pgTable("kick_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => discordMembers.id),
  kickedBy: varchar("kicked_by").notNull(),
  reason: text("reason"),
  kickedAt: timestamp("kicked_at").defaultNow()
});

export const serverStats = pgTable("server_stats", {
  id: varchar("id").primaryKey().default("main"),
  totalMembers: integer("total_members").notNull().default(0),
  onlineMembers: integer("online_members").notNull().default(0),
  activeToday: integer("active_today").notNull().default(0),
  recentKicks: integer("recent_kicks").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const blockedWords = pgTable("blocked_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull()
});

export const insertMemberSchema = createInsertSchema(discordMembers).omit({
  joinedAt: true,
  lastSeen: true
});

export const insertKickLogSchema = createInsertSchema(kickLogs).omit({
  id: true,
  kickedAt: true
});

export const insertStatsSchema = createInsertSchema(serverStats).omit({
  id: true,
  lastUpdated: true
});

export const insertBlockedWordSchema = createInsertSchema(blockedWords).omit({
  id: true,
  createdAt: true
});

export type DiscordMember = typeof discordMembers.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type KickLog = typeof kickLogs.$inferSelect;
export type InsertKickLog = z.infer<typeof insertKickLogSchema>;
export type ServerStats = typeof serverStats.$inferSelect;
export type InsertStats = z.infer<typeof insertStatsSchema>;
export type BlockedWord = typeof blockedWords.$inferSelect;
export type InsertBlockedWord = z.infer<typeof insertBlockedWordSchema>;
