import { Express } from 'express';
import { getConnectedCalendars, updateCalendarSettings, disconnectCalendar, syncCalendarEvents } from './googleCalendarRoutes';

// Helper functions that should be imported from your main routes file
type RequireAuthMiddleware = () => any;
type RequirePermissionMiddleware = (module: string, permission: string) => any;

export function setupGoogleCalendarRoutes(
  app: Express,
  requireAuth: RequireAuthMiddleware,
  requirePermission: RequirePermissionMiddleware
) {
  // Get connected Google Calendar details
  app.get(
    "/api/integrations/google-calendar/calendars",
    requireAuth(),
    requirePermission('integrations', 'canView'),
    getConnectedCalendars
  );
  
  // Update Google Calendar sync settings
  app.put(
    "/api/integrations/google-calendar/settings/:calendarId",
    requireAuth(),
    requirePermission('integrations', 'canManage'),
    updateCalendarSettings
  );
  
  // Disconnect specific Google Calendar
  app.delete(
    "/api/integrations/google-calendar/disconnect/:calendarId",
    requireAuth(),
    requirePermission('integrations', 'canManage'),
    disconnectCalendar
  );
  
  // Enhanced sync endpoint for two-way sync
  app.post(
    "/api/integrations/google-calendar/sync-v2",
    requireAuth(),
    requirePermission('integrations', 'canManage'),
    syncCalendarEvents
  );
}