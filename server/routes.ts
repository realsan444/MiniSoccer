import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { discordBot } from "./discord-bot.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes

  // Get all members
  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get server stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Kick member
  const kickMemberSchema = z.object({
    reason: z.string().optional()
  });

  app.post("/api/members/:id/kick", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = kickMemberSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { reason } = validation.data;
      const success = await discordBot.kickMember(id, 'web-dashboard', reason);

      if (success) {
        res.json({ success: true, message: "Member kicked successfully" });
      } else {
        res.status(400).json({ error: "Failed to kick member" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get recent kicks
  app.get("/api/kicks", async (req, res) => {
    try {
      const kicks = await storage.getRecentKicks(10);
      res.json(kicks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kick logs" });
    }
  });

  // Get total cash
  app.get("/api/cash/total", async (req, res) => {
    try {
      const totalCash = await storage.getTotalCash();
      res.json({ totalCash });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch total cash" });
    }
  });

  // Update member cash (set amount)
  const updateCashSchema = z.object({
    amount: z.number().min(0)
  });

  app.put("/api/members/:id/cash", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = updateCashSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { amount } = validation.data;
      const updatedMember = await storage.updateMemberCash(id, amount);

      if (updatedMember) {
        res.json(updatedMember);
      } else {
        res.status(404).json({ error: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add cash to member
  const addCashSchema = z.object({
    amount: z.number()
  });

  app.post("/api/members/:id/cash/add", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = addCashSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { amount } = validation.data;
      const updatedMember = await storage.addMemberCash(id, amount);

      if (updatedMember) {
        res.json(updatedMember);
      } else {
        res.status(404).json({ error: "Member not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Ban member
  const banMemberSchema = z.object({
    reason: z.string().optional(),
    sendInvite: z.boolean().default(false)
  });

  app.post("/api/members/:id/ban", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = banMemberSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { reason, sendInvite } = validation.data;
      const success = await discordBot.banMember(id, 'web-dashboard', reason, sendInvite);

      if (success) {
        res.json({ success: true, message: "Member banned successfully" });
      } else {
        res.status(400).json({ error: "Failed to ban member" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add role to member
  const addRoleSchema = z.object({
    roleId: z.string()
  });

  app.post("/api/members/:id/roles", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = addRoleSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { roleId } = validation.data;
      const success = await discordBot.addMemberRole(id, roleId);

      if (success) {
        const updatedMember = await storage.addMemberRole(id, roleId);
        res.json(updatedMember);
      } else {
        res.status(400).json({ error: "Failed to add role" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove role from member
  app.delete("/api/members/:id/roles/:roleId", async (req, res) => {
    try {
      const { id, roleId } = req.params;
      const success = await discordBot.removeMemberRole(id, roleId);

      if (success) {
        const updatedMember = await storage.removeMemberRole(id, roleId);
        res.json(updatedMember);
      } else {
        res.status(400).json({ error: "Failed to remove role" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get server roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await discordBot.getServerRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch server roles" });
    }
  });

  // Create new role
  const createRoleSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().optional(),
    permissions: z.array(z.string()).optional()
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validation = createRoleSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const { name, color, permissions } = validation.data;
      const newRole = await discordBot.createRole(name, color, permissions);

      if (newRole) {
        res.json(newRole);
      } else {
        res.status(400).json({ error: "Failed to create role" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get blocked words
  app.get("/api/blocked-words", async (req, res) => {
    try {
      const blockedWords = await storage.getAllBlockedWords();
      res.json(blockedWords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blocked words" });
    }
  });

  // Add blocked word
  const addBlockedWordSchema = z.object({
    word: z.string().min(1).max(100),
    createdBy: z.string()
  });

  app.post("/api/blocked-words", async (req, res) => {
    try {
      const validation = addBlockedWordSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const newBlockedWord = await storage.addBlockedWord(validation.data);
      res.json(newBlockedWord);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove blocked word
  app.delete("/api/blocked-words/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.removeBlockedWord(id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Blocked word not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove all blocked words
  app.delete("/api/blocked-words", async (req, res) => {
    try {
      const success = await storage.removeAllBlockedWords();

      if (success) {
        res.json({ success: true, message: "All blocked words removed successfully" });
      } else {
        res.status(400).json({ error: "Failed to remove blocked words" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove all members
  app.delete("/api/members", async (req, res) => {
    try {
      const success = await storage.removeAllMembers();

      if (success) {
        res.json({ success: true, message: "All members removed successfully" });
      } else {
        res.status(400).json({ error: "Failed to remove members" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    // Add client to Discord bot service for real-time updates
    discordBot.addWebSocketClient(ws);

    // Send initial data
    ws.send(JSON.stringify({ 
      type: 'connected', 
      data: { message: 'Connected to Discord bot dashboard' } 
    }));

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  // Start Discord bot
  try {
    await discordBot.start();
    console.log('Discord bot started successfully');
  } catch (error) {
    console.error('Failed to start Discord bot:', error);
  }

  return httpServer;
}
