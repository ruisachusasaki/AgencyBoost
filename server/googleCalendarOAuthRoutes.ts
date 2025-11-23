import { Express } from 'express';
import googleCalendarOAuthRouter from './googleCalendarOAuth';

// Mount Google Calendar OAuth routes
export function registerGoogleCalendarRoutes(app: Express) {
  app.use('/api/google-calendar', googleCalendarOAuthRouter);
}