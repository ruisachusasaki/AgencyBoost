/**
 * Slack Service
 * 
 * Centralized service for all Slack API interactions.
 * Provides methods for sending messages, creating channels, adding reactions, etc.
 * Used by the workflow automation engine and direct API endpoints.
 * 
 * Supports multiple Slack workspaces - can use either:
 * - Environment variables (SLACK_BOT_TOKEN) for backward compatibility
 * - Database-stored workspace credentials for multi-workspace support
 */

import crypto from 'crypto';
import { db } from './db';
import { slackWorkspaces } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface WorkspaceCredentials {
  id: string;
  name: string;
  botToken: string;
  signingSecret: string | null;
  teamId: string | null;
  teamName: string | null;
}

interface SlackApiResponse {
  ok: boolean;
  error?: string;
  channel?: string;
  ts?: string;
  user?: any;
  channels?: any[];
  members?: any[];
  [key: string]: any;
}

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  thread_ts?: string;
  mrkdwn?: boolean;
  workspaceId?: string;
}

interface SlackDM {
  userId: string;
  text: string;
  blocks?: any[];
}

interface SlackReaction {
  channel: string;
  timestamp: string;
  emoji: string;
}

interface SlackChannel {
  name: string;
  isPrivate?: boolean;
  description?: string;
}

interface SlackReminder {
  text: string;
  time: string | number;
  user?: string;
}

class SlackService {
  private botToken: string | undefined;
  private defaultChannelId: string | undefined;
  private signingSecret: string | undefined;
  private workspaceCache: Map<string, WorkspaceCredentials> = new Map();

  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.defaultChannelId = process.env.SLACK_CHANNEL_ID;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.checkActiveWorkspaces().catch(() => {});
  }

  isConfigured(): boolean {
    return !!this.botToken || this.hasActiveWorkspaces;
  }

  private hasActiveWorkspaces = false;

  async checkActiveWorkspaces(): Promise<boolean> {
    try {
      const rows = await db
        .select({ id: slackWorkspaces.id })
        .from(slackWorkspaces)
        .where(eq(slackWorkspaces.isActive, true))
        .limit(1);
      this.hasActiveWorkspaces = rows.length > 0;
      return this.hasActiveWorkspaces;
    } catch {
      return false;
    }
  }

  hasDefaultChannel(): boolean {
    return !!this.defaultChannelId;
  }

  getDefaultChannelId(): string | undefined {
    return this.defaultChannelId;
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      hasDefaultChannel: this.hasDefaultChannel(),
      hasSigningSecret: !!this.signingSecret,
      defaultChannelId: this.defaultChannelId,
    };
  }

  async getWorkspaceCredentials(workspaceId: string): Promise<WorkspaceCredentials | null> {
    if (this.workspaceCache.has(workspaceId)) {
      return this.workspaceCache.get(workspaceId)!;
    }

    try {
      const workspace = await db.select().from(slackWorkspaces)
        .where(and(eq(slackWorkspaces.id, workspaceId), eq(slackWorkspaces.isActive, true)))
        .limit(1);
      
      if (!workspace.length) {
        return null;
      }

      const creds: WorkspaceCredentials = {
        id: workspace[0].id,
        name: workspace[0].name,
        botToken: workspace[0].botToken,
        signingSecret: workspace[0].signingSecret,
        teamId: workspace[0].teamId,
        teamName: workspace[0].teamName,
      };

      this.workspaceCache.set(workspaceId, creds);
      return creds;
    } catch (error) {
      console.error('Error fetching workspace credentials:', error);
      return null;
    }
  }

  async getDefaultWorkspaceCredentials(): Promise<WorkspaceCredentials | null> {
    try {
      const workspace = await db.select().from(slackWorkspaces)
        .where(and(eq(slackWorkspaces.isDefault, true), eq(slackWorkspaces.isActive, true)))
        .limit(1);
      
      if (!workspace.length) {
        const anyWorkspace = await db.select().from(slackWorkspaces)
          .where(eq(slackWorkspaces.isActive, true))
          .limit(1);
        
        if (!anyWorkspace.length) {
          return null;
        }
        
        return {
          id: anyWorkspace[0].id,
          name: anyWorkspace[0].name,
          botToken: anyWorkspace[0].botToken,
          signingSecret: anyWorkspace[0].signingSecret,
          teamId: anyWorkspace[0].teamId,
          teamName: anyWorkspace[0].teamName,
        };
      }

      return {
        id: workspace[0].id,
        name: workspace[0].name,
        botToken: workspace[0].botToken,
        signingSecret: workspace[0].signingSecret,
        teamId: workspace[0].teamId,
        teamName: workspace[0].teamName,
      };
    } catch (error) {
      console.error('Error fetching default workspace:', error);
      return null;
    }
  }

  async listWorkspaces(): Promise<WorkspaceCredentials[]> {
    try {
      const workspaces = await db.select().from(slackWorkspaces)
        .where(eq(slackWorkspaces.isActive, true));
      
      return workspaces.map(w => ({
        id: w.id,
        name: w.name,
        botToken: w.botToken,
        signingSecret: w.signingSecret,
        teamId: w.teamId,
        teamName: w.teamName,
      }));
    } catch (error) {
      console.error('Error listing workspaces:', error);
      return [];
    }
  }

  clearWorkspaceCache(workspaceId?: string) {
    if (workspaceId) {
      this.workspaceCache.delete(workspaceId);
    } else {
      this.workspaceCache.clear();
    }
  }

  private async callSlackApi(method: string, body: Record<string, any>, token?: string): Promise<SlackApiResponse> {
    const botToken = token || this.botToken;
    if (!botToken) {
      throw new Error('Slack bot token not configured');
    }

    const response = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as SlackApiResponse;

    if (!data.ok) {
      console.error(`Slack API error (${method}):`, data.error);
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  private async getTokenForWorkspace(workspaceId?: string): Promise<string> {
    if (workspaceId) {
      const creds = await this.getWorkspaceCredentials(workspaceId);
      if (creds) {
        return creds.botToken;
      }
      throw new Error(`Workspace ${workspaceId} not found or inactive`);
    }

    const defaultWorkspace = await this.getDefaultWorkspaceCredentials();
    if (defaultWorkspace) {
      return defaultWorkspace.botToken;
    }

    if (this.botToken) {
      return this.botToken;
    }

    throw new Error('No Slack workspace configured');
  }

  async testConnection(workspaceId?: string): Promise<{ ok: boolean; team?: string; user?: string; error?: string }> {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json() as any;
      return {
        ok: data.ok,
        team: data.team,
        user: data.user,
        error: data.error,
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  async sendMessage(message: SlackMessage): Promise<{ success: boolean; ts?: string; channel?: string; error?: string }> {
    try {
      const channel = message.channel || this.defaultChannelId;
      if (!channel) {
        throw new Error('No channel specified and no default channel configured');
      }

      // Get the appropriate bot token
      const token = await this.getTokenForWorkspace(message.workspaceId);
      console.log('[Slack] Using workspace:', message.workspaceId || 'default/env');

      const payload: any = {
        channel,
        text: message.text,
        mrkdwn: message.mrkdwn !== false,
      };
      
      console.log('[Slack] Sending message with payload:', JSON.stringify(payload));

      if (message.blocks) {
        payload.blocks = message.blocks;
      }

      if (message.thread_ts) {
        payload.thread_ts = message.thread_ts;
      }

      const result = await this.callSlackApi('chat.postMessage', payload, token);

      return {
        success: true,
        ts: result.ts,
        channel: result.channel,
      };
    } catch (error: any) {
      console.error('Error sending Slack message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDirectMessage(dm: SlackDM): Promise<{ success: boolean; ts?: string; channel?: string; error?: string }> {
    try {
      const openResult = await this.callSlackApi('conversations.open', {
        users: dm.userId,
      });

      if (!openResult.channel?.id) {
        throw new Error('Failed to open DM channel');
      }

      const messageResult = await this.callSlackApi('chat.postMessage', {
        channel: openResult.channel.id,
        text: dm.text,
        blocks: dm.blocks,
      });

      return {
        success: true,
        ts: messageResult.ts,
        channel: openResult.channel.id,
      };
    } catch (error: any) {
      console.error('Error sending Slack DM:', error);
      return { success: false, error: error.message };
    }
  }

  async lookupUserByEmail(email: string): Promise<{ success: boolean; userId?: string; user?: any; error?: string }> {
    try {
      const result = await this.callSlackApi('users.lookupByEmail', { email });
      return {
        success: true,
        userId: result.user?.id,
        user: result.user,
      };
    } catch (error: any) {
      console.error('Error looking up Slack user by email:', error);
      return { success: false, error: error.message };
    }
  }

  async addReaction(reaction: SlackReaction): Promise<{ success: boolean; error?: string }> {
    try {
      await this.callSlackApi('reactions.add', {
        channel: reaction.channel,
        timestamp: reaction.timestamp,
        name: reaction.emoji.replace(/:/g, ''),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error adding Slack reaction:', error);
      return { success: false, error: error.message };
    }
  }

  async createChannel(channel: SlackChannel): Promise<{ success: boolean; channelId?: string; error?: string }> {
    try {
      const result = await this.callSlackApi('conversations.create', {
        name: channel.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        is_private: channel.isPrivate || false,
      });

      const channelId = result.channel?.id;

      if (channelId && channel.description) {
        await this.callSlackApi('conversations.setTopic', {
          channel: channelId,
          topic: channel.description,
        });
      }

      return {
        success: true,
        channelId,
      };
    } catch (error: any) {
      console.error('Error creating Slack channel:', error);
      return { success: false, error: error.message };
    }
  }

  async setChannelTopic(channelId: string, topic: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.callSlackApi('conversations.setTopic', {
        channel: channelId,
        topic,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error setting Slack channel topic:', error);
      return { success: false, error: error.message };
    }
  }

  async inviteToChannel(channelId: string, userIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      await this.callSlackApi('conversations.invite', {
        channel: channelId,
        users: userIds.join(','),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error inviting to Slack channel:', error);
      return { success: false, error: error.message };
    }
  }

  async createReminder(reminder: SlackReminder): Promise<{ success: boolean; reminderId?: string; error?: string }> {
    try {
      const result = await this.callSlackApi('reminders.add', {
        text: reminder.text,
        time: reminder.time,
        user: reminder.user,
      });
      return {
        success: true,
        reminderId: result.reminder?.id,
      };
    } catch (error: any) {
      console.error('Error creating Slack reminder:', error);
      return { success: false, error: error.message };
    }
  }

  async listChannels(workspaceId?: string): Promise<{ success: boolean; channels?: any[]; error?: string }> {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const result = await this.callSlackApi('conversations.list', {
        types: 'public_channel,private_channel',
        limit: 200,
      }, token);
      return {
        success: true,
        channels: result.channels,
      };
    } catch (error: any) {
      console.error('Error listing Slack channels:', error);
      return { success: false, error: error.message };
    }
  }

  async listUsers(workspaceId?: string): Promise<{ success: boolean; members?: any[]; error?: string }> {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const result = await this.callSlackApi('users.list', {}, token);
      return {
        success: true,
        members: result.members?.filter((m: any) => !m.is_bot && !m.deleted),
      };
    } catch (error: any) {
      console.error('Error listing Slack users:', error);
      return { success: false, error: error.message };
    }
  }

  verifySlackRequest(timestamp: string, signature: string, body: string): boolean {
    if (!this.signingSecret) {
      console.warn('Slack signing secret not configured - skipping verification');
      return true;
    }

    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) {
      console.error('Slack request timestamp too old');
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.signingSecret)
      .update(sigBasestring)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  }
}

export const slackService = new SlackService();
export type { SlackMessage, SlackDM, SlackReaction, SlackChannel, SlackReminder };
