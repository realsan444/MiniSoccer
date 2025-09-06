import { Client, GatewayIntentBits, Events, ActivityType, SlashCommandBuilder, REST, Routes } from 'discord.js';
import { storage } from './storage.js';
import { WebSocket } from 'ws';

export class DiscordBotService {
  private client: Client;
  private wsClients: Set<WebSocket> = new Set();

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once(Events.ClientReady, async (readyClient) => {
      console.log(`Discord bot ready! Logged in as ${readyClient.user.tag}`);
      
      // Set bot activity
      readyClient.user.setActivity('Member Management', { type: ActivityType.Watching });
      
      // Register slash commands
      await this.registerSlashCommands();
      
      // Initial sync of members
      await this.syncMembers();
    });

    this.client.on(Events.GuildMemberAdd, async (member) => {
      const discordMember = {
        id: member.id,
        username: member.user.username,
        displayName: member.displayName || member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatar,
        status: 'offline',
        role: this.getMemberRole(member)
      };

      await storage.createMember(discordMember);
      this.broadcastUpdate('memberJoined', discordMember);
    });

    this.client.on(Events.GuildMemberRemove, async (member) => {
      await storage.deleteMember(member.id);
      this.broadcastUpdate('memberLeft', { id: member.id });
    });

    this.client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
      if (!newPresence.member) return;
      
      const status = this.mapPresenceStatus(newPresence.status);
      const updatedMember = await storage.updateMember(newPresence.member.id, { status });
      
      if (updatedMember) {
        this.broadcastUpdate('memberStatusUpdate', updatedMember);
      }
    });

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return; // Ignore bot messages
      
      await this.handleMessageFilter(message);
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'cash') {
        await this.handleCashCommand(interaction);
      }
    });

    this.client.on(Events.Error, (error) => {
      console.error('Discord client error:', error);
    });
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('cash')
        .setDescription('Check your current cash amount')
        .toJSON(),
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN || '');
    
    try {
      const guild = this.client.guilds.cache.first();
      if (guild) {
        await rest.put(
          Routes.applicationGuildCommands(this.client.user!.id, guild.id),
          { body: commands }
        );
        console.log('Successfully registered slash commands');
      }
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  private async handleMessageFilter(message: any) {
    try {
      const blockedWords = await storage.getAllBlockedWords();
      const messageContent = message.content.toLowerCase();
      
      // Check if message contains any blocked words
      const containsBlockedWord = blockedWords.some(blockedWord => 
        messageContent.includes(blockedWord.word.toLowerCase())
      );
      
      if (containsBlockedWord) {
        // Delete the message
        await message.delete();
        
        // Send a warning message in the server channel
        try {
          await message.channel.send(
            `${message.author}, your message was removed because it contained a blocked word. Please follow the server rules.`
          );
        } catch (channelError) {
          console.log('Could not send message to channel about blocked word');
        }
        
        // Log the filtered message
        console.log(`Filtered message from ${message.author.username}: "${message.content}"`);
        
        // Broadcast the filter event to connected clients
        this.broadcastUpdate('messageFiltered', {
          userId: message.author.id,
          username: message.author.username,
          content: message.content,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error filtering message:', error);
    }
  }

  private async handleCashCommand(interaction: any) {
    try {
      const member = await storage.getMember(interaction.user.id);
      
      if (!member) {
        await interaction.reply({
          content: 'You are not registered in the system yet. Please join the server first!'
        });
        return;
      }

      await interaction.reply({
        content: `💰 ${interaction.user.displayName || interaction.user.username} has $${member.cash.toLocaleString()} money!`
      });
    } catch (error) {
      console.error('Error handling cash command:', error);
      await interaction.reply({
        content: 'Sorry, there was an error checking your cash amount. Please try again later.'
      });
    }
  }

  private async syncMembers() {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) {
        console.log('No guild found');
        return;
      }

      const members = await guild.members.fetch();
      
      for (const [memberId, member] of members.entries()) {
        if (member.user.bot) continue; // Skip bots
        
        const discordMember = {
          id: member.id,
          username: member.user.username,
          displayName: member.displayName || member.user.username,
          discriminator: member.user.discriminator,
          avatar: member.user.avatar,
          status: this.mapPresenceStatus(member.presence?.status),
          role: this.getMemberRole(member),
          roles: member.roles.cache.map(role => role.id).filter(id => id !== member.guild.roles.everyone.id),
          joinedServerAt: member.joinedAt,
          joinedDiscordAt: member.user.createdAt
        };

        await storage.createMember(discordMember);
      }

      console.log(`Synced ${members.size} members`);
    } catch (error) {
      console.error('Error syncing members:', error);
    }
  }

  private getMemberRole(member: any): string {
    if (member.permissions?.has('Administrator')) return 'Admin';
    if (member.permissions?.has('KickMembers')) return 'Moderator';
    return 'Member';
  }

  private mapPresenceStatus(status: any): string {
    switch (status) {
      case 'online': return 'online';
      case 'idle': return 'idle';
      case 'dnd': return 'dnd';
      case 'offline':
      case 'invisible':
      default: return 'offline';
    }
  }

  public addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  public async kickMember(memberId: string, kickedBy: string, reason?: string, sendInvite?: boolean): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return false;

      const member = await guild.members.fetch(memberId);
      if (!member) return false;

      // Send DM with kick message and optional invite
      if (sendInvite) {
        try {
          const invite = await guild.invites.create(guild.systemChannel || guild.channels.cache.first(), {
            maxAge: 604800, // 7 days
            maxUses: 1
          });
          
          await member.send(`You have been kicked from ${guild.name}${reason ? ` for: ${reason}` : ''}.\n\nYou can rejoin using this invite: ${invite.url}`);
        } catch (dmError) {
          console.log('Could not send DM to member');
        }
      } else if (reason) {
        try {
          await member.send(`You have been kicked from ${guild.name} for: ${reason}`);
        } catch (dmError) {
          console.log('Could not send DM to member');
        }
      }

      await member.kick(reason);
      
      // Log the kick
      await storage.createKickLog({
        memberId,
        kickedBy,
        reason
      });

      // Remove from storage
      await storage.deleteMember(memberId);
      
      this.broadcastUpdate('memberKicked', { id: memberId, reason });
      return true;
    } catch (error) {
      console.error('Error kicking member:', error);
      return false;
    }
  }

  public async banMember(memberId: string, bannedBy: string, reason?: string, sendInvite?: boolean): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return false;

      const member = await guild.members.fetch(memberId);
      if (!member) return false;

      // Send DM with ban message and optional invite
      if (sendInvite) {
        try {
          const invite = await guild.invites.create(guild.systemChannel || guild.channels.cache.first(), {
            maxAge: 604800, // 7 days
            maxUses: 1
          });
          
          await member.send(`You have been banned from ${guild.name}${reason ? ` for: ${reason}` : ''}.\n\nYou can appeal and rejoin using this invite: ${invite.url}`);
        } catch (dmError) {
          console.log('Could not send DM to member');
        }
      } else if (reason) {
        try {
          await member.send(`You have been banned from ${guild.name} for: ${reason}`);
        } catch (dmError) {
          console.log('Could not send DM to member');
        }
      }

      await guild.bans.create(member, { reason });
      
      // Remove from storage
      await storage.deleteMember(memberId);
      
      this.broadcastUpdate('memberBanned', { id: memberId, reason });
      return true;
    } catch (error) {
      console.error('Error banning member:', error);
      return false;
    }
  }

  public async addMemberRole(memberId: string, roleId: string): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return false;

      const member = await guild.members.fetch(memberId);
      const role = guild.roles.cache.get(roleId);
      
      if (!member || !role) return false;

      await member.roles.add(role);
      this.broadcastUpdate('memberRoleAdded', { id: memberId, roleId });
      return true;
    } catch (error) {
      console.error('Error adding role to member:', error);
      return false;
    }
  }

  public async removeMemberRole(memberId: string, roleId: string): Promise<boolean> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return false;

      const member = await guild.members.fetch(memberId);
      const role = guild.roles.cache.get(roleId);
      
      if (!member || !role) return false;

      await member.roles.remove(role);
      this.broadcastUpdate('memberRoleRemoved', { id: memberId, roleId });
      return true;
    } catch (error) {
      console.error('Error removing role from member:', error);
      return false;
    }
  }

  public async getServerRoles(): Promise<any[]> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return [];

      return guild.roles.cache
        .filter(role => role.name !== '@everyone' && !role.managed)
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position
        }))
        .sort((a, b) => b.position - a.position);
    } catch (error) {
      console.error('Error fetching server roles:', error);
      return [];
    }
  }

  public async createRole(name: string, color?: string, permissions?: string[]): Promise<any> {
    try {
      const guild = this.client.guilds.cache.first();
      if (!guild) return null;

      // Convert hex color string to proper format and handle permissions
      const roleData: any = {
        name,
        color: (color && color.startsWith('#')) ? parseInt(color.slice(1), 16) : 0x99AAB5,
        reason: 'Created via web dashboard'
      };

      // Add permissions if provided
      if (permissions && permissions.length > 0) {
        roleData.permissions = permissions;
      }

      const newRole = await guild.roles.create(roleData);

      return {
        id: newRole.id,
        name: newRole.name,
        color: newRole.hexColor,
        position: newRole.position,
        permissions: newRole.permissions.toArray()
      };
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  public async start() {
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is required');
    }

    await this.client.login(token);
  }

  public getClient() {
    return this.client;
  }
}

export const discordBot = new DiscordBotService();
