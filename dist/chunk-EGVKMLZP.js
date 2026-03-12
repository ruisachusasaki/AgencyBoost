import {
  db
} from "./chunk-ZZSCKNY3.js";
import {
  slackWorkspaces
} from "./chunk-JU345PWR.js";

// server/slack-service.ts
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
var SlackService = class {
  botToken;
  defaultChannelId;
  signingSecret;
  workspaceCache = /* @__PURE__ */ new Map();
  constructor() {
    this.refreshConfig();
  }
  refreshConfig() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.defaultChannelId = process.env.SLACK_CHANNEL_ID;
    this.signingSecret = process.env.SLACK_SIGNING_SECRET;
    this.checkActiveWorkspaces().catch(() => {
    });
  }
  isConfigured() {
    return !!this.botToken || this.hasActiveWorkspaces;
  }
  hasActiveWorkspaces = false;
  async checkActiveWorkspaces() {
    try {
      const rows = await db.select({ id: slackWorkspaces.id }).from(slackWorkspaces).where(eq(slackWorkspaces.isActive, true)).limit(1);
      this.hasActiveWorkspaces = rows.length > 0;
      return this.hasActiveWorkspaces;
    } catch {
      return false;
    }
  }
  hasDefaultChannel() {
    return !!this.defaultChannelId;
  }
  getDefaultChannelId() {
    return this.defaultChannelId;
  }
  getStatus() {
    return {
      configured: this.isConfigured(),
      hasDefaultChannel: this.hasDefaultChannel(),
      hasSigningSecret: !!this.signingSecret,
      defaultChannelId: this.defaultChannelId
    };
  }
  async getWorkspaceCredentials(workspaceId) {
    if (this.workspaceCache.has(workspaceId)) {
      return this.workspaceCache.get(workspaceId);
    }
    try {
      const workspace = await db.select().from(slackWorkspaces).where(and(eq(slackWorkspaces.id, workspaceId), eq(slackWorkspaces.isActive, true))).limit(1);
      if (!workspace.length) {
        return null;
      }
      const creds = {
        id: workspace[0].id,
        name: workspace[0].name,
        botToken: workspace[0].botToken,
        signingSecret: workspace[0].signingSecret,
        teamId: workspace[0].teamId,
        teamName: workspace[0].teamName
      };
      this.workspaceCache.set(workspaceId, creds);
      return creds;
    } catch (error) {
      console.error("Error fetching workspace credentials:", error);
      return null;
    }
  }
  async getDefaultWorkspaceCredentials() {
    try {
      const workspace = await db.select().from(slackWorkspaces).where(and(eq(slackWorkspaces.isDefault, true), eq(slackWorkspaces.isActive, true))).limit(1);
      if (!workspace.length) {
        const anyWorkspace = await db.select().from(slackWorkspaces).where(eq(slackWorkspaces.isActive, true)).limit(1);
        if (!anyWorkspace.length) {
          return null;
        }
        return {
          id: anyWorkspace[0].id,
          name: anyWorkspace[0].name,
          botToken: anyWorkspace[0].botToken,
          signingSecret: anyWorkspace[0].signingSecret,
          teamId: anyWorkspace[0].teamId,
          teamName: anyWorkspace[0].teamName
        };
      }
      return {
        id: workspace[0].id,
        name: workspace[0].name,
        botToken: workspace[0].botToken,
        signingSecret: workspace[0].signingSecret,
        teamId: workspace[0].teamId,
        teamName: workspace[0].teamName
      };
    } catch (error) {
      console.error("Error fetching default workspace:", error);
      return null;
    }
  }
  async listWorkspaces() {
    try {
      const workspaces = await db.select().from(slackWorkspaces).where(eq(slackWorkspaces.isActive, true));
      return workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        botToken: w.botToken,
        signingSecret: w.signingSecret,
        teamId: w.teamId,
        teamName: w.teamName
      }));
    } catch (error) {
      console.error("Error listing workspaces:", error);
      return [];
    }
  }
  clearWorkspaceCache(workspaceId) {
    if (workspaceId) {
      this.workspaceCache.delete(workspaceId);
    } else {
      this.workspaceCache.clear();
    }
  }
  async callSlackApi(method, body, token) {
    const botToken = token || this.botToken;
    if (!botToken) {
      throw new Error("Slack bot token not configured");
    }
    const response = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${botToken}`
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!data.ok) {
      console.error(`Slack API error (${method}):`, data.error);
      throw new Error(`Slack API error: ${data.error}`);
    }
    return data;
  }
  async getTokenForWorkspace(workspaceId) {
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
    throw new Error("No Slack workspace configured");
  }
  async testConnection(workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const response = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      return {
        ok: data.ok,
        team: data.team,
        user: data.user,
        error: data.error
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
  async sendMessage(message) {
    try {
      const channel = message.channel || this.defaultChannelId;
      if (!channel) {
        throw new Error("No channel specified and no default channel configured");
      }
      const token = await this.getTokenForWorkspace(message.workspaceId);
      console.log("[Slack] Using workspace:", message.workspaceId || "default/env");
      const payload = {
        channel,
        text: message.text,
        mrkdwn: message.mrkdwn !== false
      };
      console.log("[Slack] Sending message with payload:", JSON.stringify(payload));
      if (message.blocks) {
        payload.blocks = message.blocks;
      }
      if (message.thread_ts) {
        payload.thread_ts = message.thread_ts;
      }
      const result = await this.callSlackApi("chat.postMessage", payload, token);
      return {
        success: true,
        ts: result.ts,
        channel: result.channel
      };
    } catch (error) {
      console.error("Error sending Slack message:", error);
      return { success: false, error: error.message };
    }
  }
  async sendDirectMessage(dm) {
    try {
      const token = await this.getTokenForWorkspace(dm.workspaceId);
      const openResult = await this.callSlackApi("conversations.open", {
        users: dm.userId
      }, token);
      if (!openResult.channel?.id) {
        throw new Error("Failed to open DM channel");
      }
      const messageResult = await this.callSlackApi("chat.postMessage", {
        channel: openResult.channel.id,
        text: dm.text,
        blocks: dm.blocks
      }, token);
      return {
        success: true,
        ts: messageResult.ts,
        channel: openResult.channel.id
      };
    } catch (error) {
      console.error("Error sending Slack DM:", error);
      return { success: false, error: error.message };
    }
  }
  async lookupUserByEmail(email, workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const result = await this.callSlackApi("users.lookupByEmail", { email }, token);
      return {
        success: true,
        userId: result.user?.id,
        user: result.user
      };
    } catch (error) {
      console.error("Error looking up Slack user by email:", error);
      return { success: false, error: error.message };
    }
  }
  async addReaction(reaction) {
    try {
      const token = await this.getTokenForWorkspace(reaction.workspaceId);
      await this.callSlackApi("reactions.add", {
        channel: reaction.channel,
        timestamp: reaction.timestamp,
        name: reaction.emoji.replace(/:/g, "")
      }, token);
      return { success: true };
    } catch (error) {
      console.error("Error adding Slack reaction:", error);
      return { success: false, error: error.message };
    }
  }
  async createChannel(channel) {
    try {
      const token = await this.getTokenForWorkspace(channel.workspaceId);
      const result = await this.callSlackApi("conversations.create", {
        name: channel.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
        is_private: channel.isPrivate || false
      }, token);
      const channelId = result.channel?.id;
      if (channelId && channel.description) {
        await this.callSlackApi("conversations.setTopic", {
          channel: channelId,
          topic: channel.description
        }, token);
      }
      return {
        success: true,
        channelId
      };
    } catch (error) {
      console.error("Error creating Slack channel:", error);
      return { success: false, error: error.message };
    }
  }
  async setChannelTopic(channelId, topic, workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      await this.callSlackApi("conversations.setTopic", {
        channel: channelId,
        topic
      }, token);
      return { success: true };
    } catch (error) {
      console.error("Error setting Slack channel topic:", error);
      return { success: false, error: error.message };
    }
  }
  async inviteToChannel(channelId, userIds, workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      await this.callSlackApi("conversations.invite", {
        channel: channelId,
        users: userIds.join(",")
      }, token);
      return { success: true };
    } catch (error) {
      console.error("Error inviting to Slack channel:", error);
      return { success: false, error: error.message };
    }
  }
  async createReminder(reminder) {
    try {
      const token = await this.getTokenForWorkspace(reminder.workspaceId);
      const result = await this.callSlackApi("reminders.add", {
        text: reminder.text,
        time: reminder.time,
        user: reminder.user
      }, token);
      return {
        success: true,
        reminderId: result.reminder?.id
      };
    } catch (error) {
      console.error("Error creating Slack reminder:", error);
      return { success: false, error: error.message };
    }
  }
  async listChannels(workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const result = await this.callSlackApi("conversations.list", {
        types: "public_channel,private_channel",
        limit: 200
      }, token);
      return {
        success: true,
        channels: result.channels
      };
    } catch (error) {
      console.error("Error listing Slack channels:", error);
      return { success: false, error: error.message };
    }
  }
  async listUsers(workspaceId) {
    try {
      const token = await this.getTokenForWorkspace(workspaceId);
      const result = await this.callSlackApi("users.list", {}, token);
      return {
        success: true,
        members: result.members?.filter((m) => !m.is_bot && !m.deleted)
      };
    } catch (error) {
      console.error("Error listing Slack users:", error);
      return { success: false, error: error.message };
    }
  }
  verifySlackRequest(timestamp, signature, body) {
    if (!this.signingSecret) {
      console.warn("Slack signing secret not configured - skipping verification");
      return true;
    }
    const fiveMinutesAgo = Math.floor(Date.now() / 1e3) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) {
      console.error("Slack request timestamp too old");
      return false;
    }
    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = "v0=" + crypto.createHmac("sha256", this.signingSecret).update(sigBasestring).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  }
};
var slackService = new SlackService();

export {
  slackService
};
