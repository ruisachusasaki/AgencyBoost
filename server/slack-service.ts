/**
 * Slack Service
 * 
 * Centralized service for all Slack API interactions.
 * Provides methods for sending messages, creating channels, adding reactions, etc.
 * Used by the workflow automation engine and direct API endpoints.
 */

import crypto from 'crypto';

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

  constructor() {
    this.refreshConfig();
  }

  refreshConfig() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.defaultChannelId = process.env.SLACK_CHANNEL_ID;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
  }

  isConfigured(): boolean {
    return !!this.botToken;
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

  private async callSlackApi(method: string, body: Record<string, any>): Promise<SlackApiResponse> {
    if (!this.botToken) {
      throw new Error('Slack bot token not configured');
    }

    const response = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.botToken}`,
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

  async testConnection(): Promise<{ ok: boolean; team?: string; user?: string; error?: string }> {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
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

      // Debug: Test bot connection first
      const authTest = await this.testConnection();
      console.log('[Slack] Bot auth test:', authTest);

      // Debug: Try to check if bot can see the channel
      try {
        const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.botToken}`,
          },
          body: JSON.stringify({ types: 'public_channel,private_channel', limit: 100 }),
        });
        const channelsData = await channelsResponse.json() as any;
        console.log('[Slack] Bot can see channels:', channelsData.ok ? channelsData.channels?.map((c: any) => ({ id: c.id, name: c.name })).slice(0, 10) : channelsData.error);
        
        // Check if target channel is in the list
        const targetChannel = channelsData.channels?.find((c: any) => c.id === channel);
        console.log('[Slack] Target channel found:', targetChannel ? { id: targetChannel.id, name: targetChannel.name, is_member: targetChannel.is_member } : 'NOT FOUND');
      } catch (e: any) {
        console.log('[Slack] Error listing channels:', e.message);
      }

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

      const result = await this.callSlackApi('chat.postMessage', payload);

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

  async listChannels(): Promise<{ success: boolean; channels?: any[]; error?: string }> {
    try {
      const result = await this.callSlackApi('conversations.list', {
        types: 'public_channel,private_channel',
        limit: 200,
      });
      return {
        success: true,
        channels: result.channels,
      };
    } catch (error: any) {
      console.error('Error listing Slack channels:', error);
      return { success: false, error: error.message };
    }
  }

  async listUsers(): Promise<{ success: boolean; members?: any[]; error?: string }> {
    try {
      const result = await this.callSlackApi('users.list', {});
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
