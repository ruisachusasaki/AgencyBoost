import { Express } from 'express';
import googleCalendarOAuthRouter from './googleCalendarOAuth';

// Mount Google Calendar OAuth routes
export function setupGoogleCalendar(app: Express) {
  console.log('🗓️ Mounting Google Calendar OAuth routes at /api/google-calendar');
  app.use('/api/google-calendar', googleCalendarOAuthRouter);
}