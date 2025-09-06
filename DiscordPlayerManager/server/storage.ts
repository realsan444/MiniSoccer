import { 
  type DiscordMember, 
  type InsertMember, 
  type KickLog, 
  type InsertKickLog, 
  type ServerStats, 
  type InsertStats, 
  type BlockedWord, 
  type InsertBlockedWord,
  discordMembers,
  kickLogs,
  serverStats,
  blockedWords 
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Members
  getAllMembers(): Promise<DiscordMember[]>;
  getMember(id: string): Promise<DiscordMember | undefined>;
  createMember(member: InsertMember): Promise<DiscordMember>;
  updateMember(id: string, updates: Partial<DiscordMember>): Promise<DiscordMember | undefined>;
  deleteMember(id: string): Promise<boolean>;
  
  // Cash Management
  updateMemberCash(id: string, amount: number): Promise<DiscordMember | undefined>;
  addMemberCash(id: string, amount: number): Promise<DiscordMember | undefined>;
  getTotalCash(): Promise<number>;
  
  // Role Management
  addMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined>;
  removeMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined>;
  
  // Kick Logs
  createKickLog(log: InsertKickLog): Promise<KickLog>;
  getRecentKicks(limit?: number): Promise<KickLog[]>;
  
  // Server Stats
  getStats(): Promise<ServerStats>;
  updateStats(stats: Partial<InsertStats>): Promise<ServerStats>;
  
  // Blocked Words
  getAllBlockedWords(): Promise<BlockedWord[]>;
  addBlockedWord(word: InsertBlockedWord): Promise<BlockedWord>;
  removeBlockedWord(id: string): Promise<boolean>;
  removeAllBlockedWords(): Promise<boolean>;
  
  // Utility methods
  removeAllMembers(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private members: Map<string, DiscordMember>;
  private kickLogs: Map<string, KickLog>;
  private blockedWords: Map<string, BlockedWord>;
  private stats: ServerStats;

  constructor() {
    this.members = new Map();
    this.kickLogs = new Map();
    this.blockedWords = new Map();
    this.stats = {
      id: "main",
      totalMembers: 0,
      onlineMembers: 0,
      activeToday: 0,
      recentKicks: 0,
      lastUpdated: new Date()
    };
  }

  async getAllMembers(): Promise<DiscordMember[]> {
    return Array.from(this.members.values());
  }

  async getMember(id: string): Promise<DiscordMember | undefined> {
    return this.members.get(id);
  }

  async createMember(insertMember: InsertMember): Promise<DiscordMember> {
    const member: DiscordMember = {
      ...insertMember,
      discriminator: insertMember.discriminator || null,
      avatar: insertMember.avatar || null,
      role: insertMember.role || 'Member',
      status: insertMember.status || 'offline',
      roles: insertMember.roles || [],
      cash: insertMember.cash || 0,
      joinedServerAt: insertMember.joinedServerAt || new Date(),
      joinedDiscordAt: insertMember.joinedDiscordAt || null,
      joinedAt: new Date(),
      lastSeen: new Date()
    };
    this.members.set(member.id, member);
    await this.updateMemberCount();
    return member;
  }

  async updateMember(id: string, updates: Partial<DiscordMember>): Promise<DiscordMember | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...updates, lastSeen: new Date() };
    this.members.set(id, updatedMember);
    await this.updateMemberCount();
    return updatedMember;
  }

  async deleteMember(id: string): Promise<boolean> {
    const deleted = this.members.delete(id);
    if (deleted) {
      await this.updateMemberCount();
    }
    return deleted;
  }

  async createKickLog(insertLog: InsertKickLog): Promise<KickLog> {
    const log: KickLog = {
      id: randomUUID(),
      ...insertLog,
      reason: insertLog.reason || null,
      kickedAt: new Date()
    };
    this.kickLogs.set(log.id, log);
    
    // Update recent kicks count
    const recentKicks = Array.from(this.kickLogs.values())
      .filter(log => {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return log.kickedAt && log.kickedAt > dayAgo;
      }).length;
    
    this.stats.recentKicks = recentKicks;
    return log;
  }

  async getRecentKicks(limit = 10): Promise<KickLog[]> {
    return Array.from(this.kickLogs.values())
      .sort((a, b) => (b.kickedAt?.getTime() || 0) - (a.kickedAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getStats(): Promise<ServerStats> {
    return this.stats;
  }

  async updateStats(updates: Partial<InsertStats>): Promise<ServerStats> {
    this.stats = { ...this.stats, ...updates, lastUpdated: new Date() };
    return this.stats;
  }

  async updateMemberCash(id: string, amount: number): Promise<DiscordMember | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, cash: amount, lastSeen: new Date() };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async addMemberCash(id: string, amount: number): Promise<DiscordMember | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, cash: member.cash + amount, lastSeen: new Date() };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async getTotalCash(): Promise<number> {
    return Array.from(this.members.values()).reduce((total, member) => total + member.cash, 0);
  }

  async addMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const roles = [...member.roles];
    if (!roles.includes(roleId)) {
      roles.push(roleId);
    }
    
    const updatedMember = { ...member, roles, lastSeen: new Date() };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async removeMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    
    const roles = member.roles.filter(r => r !== roleId);
    const updatedMember = { ...member, roles, lastSeen: new Date() };
    this.members.set(id, updatedMember);
    return updatedMember;
  }

  async getAllBlockedWords(): Promise<BlockedWord[]> {
    return Array.from(this.blockedWords.values());
  }

  async addBlockedWord(insertWord: InsertBlockedWord): Promise<BlockedWord> {
    const blockedWord: BlockedWord = {
      id: randomUUID(),
      ...insertWord,
      createdAt: new Date()
    };
    this.blockedWords.set(blockedWord.id, blockedWord);
    return blockedWord;
  }

  async removeBlockedWord(id: string): Promise<boolean> {
    return this.blockedWords.delete(id);
  }

  async removeAllBlockedWords(): Promise<boolean> {
    this.blockedWords.clear();
    return true;
  }

  async removeAllMembers(): Promise<boolean> {
    this.members.clear();
    await this.updateMemberCount();
    return true;
  }

  private async updateMemberCount(): Promise<void> {
    const members = Array.from(this.members.values());
    this.stats.totalMembers = members.length;
    this.stats.onlineMembers = members.filter(m => m.status === 'online').length;
    
    // Count active today (members seen in last 24 hours)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    this.stats.activeToday = members.filter(m => m.lastSeen && m.lastSeen > dayAgo).length;
  }
}

export class DatabaseStorage implements IStorage {
  async getAllMembers(): Promise<DiscordMember[]> {
    return await db.select().from(discordMembers);
  }

  async getMember(id: string): Promise<DiscordMember | undefined> {
    const [member] = await db.select().from(discordMembers).where(eq(discordMembers.id, id));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<DiscordMember> {
    const [member] = await db
      .insert(discordMembers)
      .values({
        ...insertMember,
        role: insertMember.role || 'Member',
        status: insertMember.status || 'offline',
        roles: insertMember.roles || [],
        cash: insertMember.cash || 0,
        joinedServerAt: insertMember.joinedServerAt || new Date(),
        joinedDiscordAt: insertMember.joinedDiscordAt || null,
      })
      .returning();
    
    await this.updateMemberCount();
    return member;
  }

  async updateMember(id: string, updates: Partial<DiscordMember>): Promise<DiscordMember | undefined> {
    const [member] = await db
      .update(discordMembers)
      .set({ ...updates, lastSeen: new Date() })
      .where(eq(discordMembers.id, id))
      .returning();
    
    if (member) {
      await this.updateMemberCount();
    }
    return member || undefined;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(discordMembers).where(eq(discordMembers.id, id));
    const deleted = (result.rowCount || 0) > 0;
    if (deleted) {
      await this.updateMemberCount();
    }
    return deleted;
  }

  async updateMemberCash(id: string, amount: number): Promise<DiscordMember | undefined> {
    const [member] = await db
      .update(discordMembers)
      .set({ cash: amount, lastSeen: new Date() })
      .where(eq(discordMembers.id, id))
      .returning();
    
    return member || undefined;
  }

  async addMemberCash(id: string, amount: number): Promise<DiscordMember | undefined> {
    const [member] = await db
      .update(discordMembers)
      .set({ 
        cash: sql`${discordMembers.cash} + ${amount}`,
        lastSeen: new Date() 
      })
      .where(eq(discordMembers.id, id))
      .returning();
    
    return member || undefined;
  }

  async getTotalCash(): Promise<number> {
    const result = await db
      .select({ totalCash: sql<number>`COALESCE(SUM(${discordMembers.cash}), 0)` })
      .from(discordMembers);
    
    return result[0]?.totalCash || 0;
  }

  async addMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined> {
    const member = await this.getMember(id);
    if (!member) return undefined;
    
    const roles = [...member.roles];
    if (!roles.includes(roleId)) {
      roles.push(roleId);
    }
    
    return await this.updateMember(id, { roles });
  }

  async removeMemberRole(id: string, roleId: string): Promise<DiscordMember | undefined> {
    const member = await this.getMember(id);
    if (!member) return undefined;
    
    const roles = member.roles.filter(r => r !== roleId);
    return await this.updateMember(id, { roles });
  }

  async createKickLog(insertLog: InsertKickLog): Promise<KickLog> {
    const [log] = await db
      .insert(kickLogs)
      .values({
        ...insertLog,
        reason: insertLog.reason || null,
      })
      .returning();
    
    // Update recent kicks count
    await this.updateRecentKicksCount();
    return log;
  }

  async getRecentKicks(limit = 10): Promise<KickLog[]> {
    return await db
      .select()
      .from(kickLogs)
      .orderBy(desc(kickLogs.kickedAt))
      .limit(limit);
  }

  async getStats(): Promise<ServerStats> {
    let [stats] = await db.select().from(serverStats).where(eq(serverStats.id, "main"));
    
    if (!stats) {
      // Create initial stats if they don't exist
      [stats] = await db
        .insert(serverStats)
        .values({
          id: "main",
          totalMembers: 0,
          onlineMembers: 0,
          activeToday: 0,
          recentKicks: 0,
        })
        .returning();
    }
    
    return stats;
  }

  async updateStats(updates: Partial<InsertStats>): Promise<ServerStats> {
    const [stats] = await db
      .update(serverStats)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(serverStats.id, "main"))
      .returning();
    
    return stats;
  }

  async getAllBlockedWords(): Promise<BlockedWord[]> {
    return await db.select().from(blockedWords);
  }

  async addBlockedWord(insertWord: InsertBlockedWord): Promise<BlockedWord> {
    const [blockedWord] = await db
      .insert(blockedWords)
      .values(insertWord)
      .returning();
    
    return blockedWord;
  }

  async removeBlockedWord(id: string): Promise<boolean> {
    const result = await db.delete(blockedWords).where(eq(blockedWords.id, id));
    return (result.rowCount || 0) > 0;
  }

  async removeAllBlockedWords(): Promise<boolean> {
    const result = await db.delete(blockedWords);
    return (result.rowCount || 0) > 0;
  }

  async removeAllMembers(): Promise<boolean> {
    const result = await db.delete(discordMembers);
    const deleted = (result.rowCount || 0) > 0;
    if (deleted) {
      await this.updateMemberCount();
    }
    return deleted;
  }

  private async updateMemberCount(): Promise<void> {
    const members = await this.getAllMembers();
    const totalMembers = members.length;
    const onlineMembers = members.filter(m => m.status === 'online').length;
    
    // Count active today (members seen in last 24 hours)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const activeToday = members.filter(m => m.lastSeen && m.lastSeen > dayAgo).length;

    await this.updateStats({
      totalMembers,
      onlineMembers,
      activeToday,
    });
  }

  private async updateRecentKicksCount(): Promise<void> {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const recentKicksResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(kickLogs)
      .where(sql`${kickLogs.kickedAt} > ${dayAgo}`);
    
    const recentKicks = recentKicksResult[0]?.count || 0;
    
    await this.updateStats({ recentKicks });
  }
}

export const storage = new DatabaseStorage();
