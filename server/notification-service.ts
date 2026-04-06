import { IStorage } from "./storage";
import { InsertNotification, NotificationSettings } from "@shared/schema";
import Mailgun from "mailgun.js";
import formData from "form-data";
import { EncryptionService } from "./encryption";

const mailgun = new Mailgun(formData);

interface NotificationOptions {
  userId: string;
  type: 'client_assigned' | 'chat_added' | 'chat_messages' | 'mentioned' | 'mention_follow_up' | 'task_assigned';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SmsOptions {
  to: string;
  body: string;
}

export class NotificationService {
  private storage: IStorage;
  private mailgunClient: any;
  private twilioClient: any;
  private emailConfig: any = null;
  private smsConfig: any = null;

  constructor(storage: IStorage) {
    this.storage = storage;
    
    // Initialize integrations asynchronously
    this.initializeIntegrations();
  }

  async reinitializeIntegrations() {
    this.mailgunClient = null;
    this.emailConfig = null;
    await this.initializeIntegrations();
  }

  /**
   * Initialize email and SMS integrations from database and environment
   */
  private async initializeIntegrations() {
    try {
      // Get email integration from database (Mailgun already configured)
      const emailIntegrations = await this.storage.getEmailIntegrations();
      const activeEmailIntegration = emailIntegrations.find(i => i.isActive && i.provider === 'mailgun');
      
      if (activeEmailIntegration) {
        this.emailConfig = activeEmailIntegration;
        let decryptedKey = activeEmailIntegration.apiKey;
        try {
          decryptedKey = EncryptionService.decrypt(activeEmailIntegration.apiKey);
        } catch {
        }
        this.mailgunClient = mailgun.client({
          username: 'api',
          key: decryptedKey
        });
        console.log('[NotificationService] Mailgun initialized from database:', activeEmailIntegration.domain);
      } else {
        console.warn('[NotificationService] No active Mailgun integration found in database');
      }

      // Get SMS integration from database (Twilio already configured)
      const smsIntegrations = await this.storage.getSmsIntegrations();
      const activeSmsIntegration = smsIntegrations.find(i => i.isActive && i.provider === 'twilio');
      
      if (activeSmsIntegration) {
        this.smsConfig = activeSmsIntegration;
        const Twilio = (await import('twilio')).default;
        this.twilioClient = Twilio(
          activeSmsIntegration.accountSid,
          activeSmsIntegration.authToken
        );
        console.log('[NotificationService] Twilio initialized from database:', activeSmsIntegration.phoneNumber);
      } else {
        console.warn('[NotificationService] No active Twilio integration found in database');
      }
    } catch (error) {
      console.error('[NotificationService] Failed to initialize integrations:', error);
    }
  }

  /**
   * Main method to create and deliver a notification across all enabled channels
   */
  async notify(options: NotificationOptions): Promise<void> {
    try {
      // Get user's notification preferences
      const preferences = await this.getUserPreferences(options.userId);
      
      // Get user details for email/SMS
      const user = await this.storage.getStaffMember(options.userId);
      if (!user) {
        console.error('[NotificationService] User not found:', options.userId);
        return;
      }

      // Create in-app notification if enabled
      if (this.shouldSendInApp(options.type, preferences)) {
        await this.deliverInApp(options);
      }

      // Send email if enabled
      if (this.shouldSendEmail(options.type, preferences) && user.email) {
        await this.deliverEmail(options, user.email);
      }

      // Send SMS if enabled
      if (this.shouldSendSms(options.type, preferences) && user.phone) {
        await this.deliverSms(options, user.phone);
      }
    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error);
      // Don't throw - we don't want notification failures to break the main operation
    }
  }

  /**
   * Helper method for client assignment notifications
   */
  async notifyClientAssigned(userId: string, clientName: string, assignedBy: string, clientId: string): Promise<void> {
    await this.notify({
      userId,
      type: 'client_assigned',
      title: 'New Client Assignment',
      message: `You have been assigned to ${clientName}`,
      entityType: 'client',
      entityId: clientId,
      actionUrl: `/clients/${clientId}`,
      actionText: 'View Client',
      priority: 'normal',
      metadata: { clientName, assignedBy }
    });
  }

  /**
   * Helper method for task assignment notifications
   */
  async notifyTaskAssigned(userId: string, taskTitle: string, assignedBy: string, taskId: string, taskType: string = 'task'): Promise<void> {
    await this.notify({
      userId,
      type: 'task_assigned',
      title: 'New Task Assignment',
      message: `You have been assigned: ${taskTitle}`,
      entityType: taskType,
      entityId: taskId,
      actionUrl: taskType === 'task' ? `/tasks` : `/clients`, // Generic - can be improved
      actionText: 'View Task',
      priority: 'normal',
      metadata: { taskTitle, assignedBy }
    });
  }

  /**
   * Helper method for @mention notifications
   */
  async notifyMentioned(userId: string, mentionedBy: string, contextType: string, contextId: string, message: string): Promise<void> {
    const user = await this.storage.getStaffMember(mentionedBy);
    const mentionerName = user ? `${user.firstName} ${user.lastName}` : 'Someone';
    
    await this.notify({
      userId,
      type: 'mentioned',
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      entityType: contextType,
      entityId: contextId,
      actionUrl: this.getContextUrl(contextType, contextId),
      actionText: 'View',
      priority: 'normal',
      metadata: { mentionedBy, contextType, contextId }
    });
  }

  /**
   * Helper method for @mention notifications in task comments (includes task name context)
   */
  async notifyMentionedInTask(userId: string, mentionedBy: string, taskId: string, taskName: string, commentContent: string): Promise<void> {
    const user = await this.storage.getStaffMember(mentionedBy);
    const mentionerName = user ? `${user.firstName} ${user.lastName}` : 'Someone';
    const preview = commentContent.substring(0, 100) + (commentContent.length > 100 ? '...' : '');
    
    const title = taskName ? `Mentioned in task: ${taskName}` : 'You were mentioned';
    const message = taskName 
      ? `${mentionerName} mentioned you in "${taskName}": ${preview}`
      : `${mentionerName} mentioned you: ${preview}`;
    
    await this.notify({
      userId,
      type: 'mentioned',
      title,
      message,
      entityType: 'task',
      entityId: taskId,
      actionUrl: `/tasks/${taskId}`,
      actionText: 'View Task',
      priority: 'normal',
      metadata: { mentionedBy, contextType: 'task', contextId: taskId, taskName }
    });
  }

  /**
   * Get notification preferences for a user
   */
  private async getUserPreferences(userId: string): Promise<NotificationSettings> {
    try {
      const settings = await this.storage.getNotificationSettings(userId);
      if (settings) {
        return settings;
      }
    } catch (error) {
      console.error('[NotificationService] Error fetching preferences:', error);
    }

    // Return defaults if preferences not found
    return {
      id: '',
      userId,
      clientAssignedInApp: true,
      clientAssignedEmail: true,
      clientAssignedSms: false,
      chatAddedInApp: true,
      chatAddedEmail: true,
      chatAddedSms: false,
      chatMessagesInApp: true,
      mentionedInApp: true,
      mentionedEmail: true,
      mentionedSms: false,
      mentionFollowUpInApp: true,
      mentionFollowUpEmail: true,
      mentionFollowUpSms: false,
      taskAssignedInApp: true,
      taskAssignedEmail: true,
      taskAssignedSms: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Check if in-app notification should be sent
   */
  private shouldSendInApp(type: string, prefs: NotificationSettings): boolean {
    const mapping: Record<string, keyof NotificationSettings> = {
      'client_assigned': 'clientAssignedInApp',
      'chat_added': 'chatAddedInApp',
      'chat_messages': 'chatMessagesInApp',
      'mentioned': 'mentionedInApp',
      'mention_follow_up': 'mentionFollowUpInApp',
      'task_assigned': 'taskAssignedInApp',
    };
    
    const key = mapping[type];
    return key ? Boolean(prefs[key]) : true; // Default to true if unknown type
  }

  /**
   * Check if email notification should be sent
   */
  private shouldSendEmail(type: string, prefs: NotificationSettings): boolean {
    const mapping: Record<string, keyof NotificationSettings> = {
      'client_assigned': 'clientAssignedEmail',
      'chat_added': 'chatAddedEmail',
      'mentioned': 'mentionedEmail',
      'mention_follow_up': 'mentionFollowUpEmail',
      'task_assigned': 'taskAssignedEmail',
    };
    
    const key = mapping[type];
    return key ? Boolean(prefs[key]) : false; // Default to false if unknown type
  }

  /**
   * Check if SMS notification should be sent
   */
  private shouldSendSms(type: string, prefs: NotificationSettings): boolean {
    const mapping: Record<string, keyof NotificationSettings> = {
      'client_assigned': 'clientAssignedSms',
      'chat_added': 'chatAddedSms',
      'mentioned': 'mentionedSms',
      'mention_follow_up': 'mentionFollowUpSms',
      'task_assigned': 'taskAssignedSms',
    };
    
    const key = mapping[type];
    return key ? Boolean(prefs[key]) : false; // Default to false if unknown type
  }

  /**
   * Deliver in-app notification
   */
  private async deliverInApp(options: NotificationOptions): Promise<void> {
    const notification: InsertNotification = {
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      entityType: options.entityType,
      entityId: options.entityId,
      actionUrl: options.actionUrl,
      actionText: options.actionText,
      priority: options.priority || 'normal',
      metadata: options.metadata,
      isRead: false,
    };

    await this.storage.createNotification(notification);
  }

  /**
   * Deliver email notification
   */
  private async deliverEmail(options: NotificationOptions, toEmail: string): Promise<void> {
    if (!this.mailgunClient) {
      console.warn('[NotificationService] Mailgun not configured, skipping email');
      return;
    }

    try {
      const emailOptions: EmailOptions = {
        to: toEmail,
        subject: options.title,
        text: options.message,
        html: this.generateEmailHtml(options),
      };

      await this.sendEmail(emailOptions);
    } catch (error) {
      console.error('[NotificationService] Error sending email:', error);
    }
  }

  /**
   * Deliver SMS notification
   */
  private async deliverSms(options: NotificationOptions, toPhone: string): Promise<void> {
    if (!this.twilioClient) {
      console.warn('[NotificationService] Twilio not configured, skipping SMS');
      return;
    }

    try {
      const smsOptions: SmsOptions = {
        to: toPhone,
        body: `${options.title}: ${options.message}`,
      };

      await this.sendSms(smsOptions);
    } catch (error) {
      console.error('[NotificationService] Error sending SMS:', error);
    }
  }

  /**
   * Send email via Mailgun
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.mailgunClient || !this.emailConfig) {
      return;
    }

    await this.mailgunClient.messages.create(this.emailConfig.domain, {
      from: `${this.emailConfig.fromName} <${this.emailConfig.fromEmail}>`,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSms(options: SmsOptions): Promise<void> {
    if (!this.twilioClient || !this.smsConfig?.phoneNumber) {
      return;
    }

    await this.twilioClient.messages.create({
      body: options.body,
      from: this.smsConfig.phoneNumber,
      to: options.to,
    });
  }

  /**
   * Generate HTML email template
   */
  private generateEmailHtml(options: NotificationOptions): string {
    const appUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://agencyflow.app';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #00C9C6 0%, #00A8A6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .message {
      font-size: 16px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #00C9C6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .button:hover {
      background: #00A8A6;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${options.title}</h1>
  </div>
  <div class="content">
    <p class="message">${options.message}</p>
    ${options.actionUrl ? `
      <a href="${appUrl}${options.actionUrl}" class="button">
        ${options.actionText || 'View Details'}
      </a>
    ` : ''}
  </div>
  <div class="footer">
    <p>You're receiving this because of your notification settings in AgencyBoost.</p>
    <p><a href="${appUrl}/settings/my-profile">Manage your notification preferences</a></p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send a direct email via Mailgun (public method for use by other services like workflow engine)
   */
  async sendDirectEmail(options: { to: string; subject: string; text: string; html?: string; attachment?: { data: Buffer; filename: string; contentType?: string } }): Promise<{ sent: boolean; error?: string }> {
    if (!this.mailgunClient || !this.emailConfig) {
      return { sent: false, error: "Mailgun not configured" };
    }

    try {
      const msgData: any = {
        from: `${this.emailConfig.fromName} <${this.emailConfig.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      };
      if (options.attachment) {
        msgData.attachment = [{
          data: options.attachment.data,
          filename: options.attachment.filename,
          contentType: options.attachment.contentType || 'application/pdf',
        }];
      }
      await this.mailgunClient.messages.create(this.emailConfig.domain, msgData);
      return { sent: true };
    } catch (err: any) {
      console.error('[NotificationService] sendDirectEmail error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Check if Mailgun email is configured and ready
   */
  isEmailConfigured(): boolean {
    return !!(this.mailgunClient && this.emailConfig);
  }

  /**
   * Generate a branded HTML email for reports
   */
  generateReportEmailHtml(options: { title: string; bodyHtml: string; actionUrl?: string; actionText?: string }): string {
    const appUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://agencyflow.app';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #00C9C6 0%, #00A8A6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .staff-row {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }
    .staff-row:last-child {
      border-bottom: none;
    }
    .staff-name {
      font-weight: 600;
      color: #333;
    }
    .staff-hours {
      color: #e53e3e;
      font-weight: 500;
    }
    .staff-detail {
      color: #666;
      font-size: 13px;
    }
    .summary {
      background: #f7fafc;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
      font-size: 14px;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #00C9C6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${options.title}</h1>
  </div>
  <div class="content">
    ${options.bodyHtml}
    ${options.actionUrl ? `
      <a href="${appUrl}${options.actionUrl}" class="button">
        ${options.actionText || 'View Details'}
      </a>
    ` : ''}
  </div>
  <div class="footer">
    <p>This is an automated report from AgencyBoost.</p>
    <p><a href="${appUrl}/settings/my-profile">Manage notification preferences</a></p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get URL for context type
   */
  private getContextUrl(contextType: string, contextId: string): string {
    const urlMapping: Record<string, string> = {
      'client': `/clients/${contextId}`,
      'task': `/tasks/${contextId}`,
      'deal': `/deals/${contextId}`,
      'lead': `/leads/${contextId}`,
      'knowledge_base_article': `/knowledge-base/articles/${contextId}`,
    };
    
    return urlMapping[contextType] || '/';
  }
}

let _sharedInstance: NotificationService | null = null;

export function setNotificationServiceInstance(instance: NotificationService) {
  _sharedInstance = instance;
}

export function getNotificationService(): NotificationService | null {
  return _sharedInstance;
}
