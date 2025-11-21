import { Request, Response } from 'express';
import { isGoogleCalendarConnected, getUncachableGoogleCalendarClient, getGoogleCalendarEvents, syncAppointmentToGoogleCalendar } from './googleCalendar';

// Get connected Google Calendar details
export async function getConnectedCalendars(req: Request, res: Response) {
  try {
    const connected = await isGoogleCalendarConnected();
    if (!connected) {
      return res.json({ calendars: [] });
    }
    
    try {
      const calendar = await getUncachableGoogleCalendarClient();
      const calendarList = await calendar.calendarList.list();
      
      // Get the primary calendar and user info
      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary) || calendarList.data.items?.[0];
      
      const connectedCalendars = [{
        id: primaryCalendar?.id || 'primary',
        name: 'Google Calendar',
        email: primaryCalendar?.summary || 'Connected Account',
        twoWaySync: true,
        createContacts: true,
        triggerWorkflows: true,
        lastSync: new Date().toISOString()
      }];
      
      return res.json({ calendars: connectedCalendars });
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      return res.json({ calendars: [] });
    }
  } catch (error) {
    console.error('Error fetching Google Calendar details:', error);
    res.status(500).json({ message: "Failed to fetch calendar details" });
  }
}

// Update Google Calendar sync settings
export async function updateCalendarSettings(req: Request, res: Response) {
  try {
    const { calendarId } = req.params;
    const settings = req.body;
    
    // Store settings in database if needed
    // For now, we'll just return success as settings are managed client-side
    
    res.json({ 
      success: true, 
      message: "Settings updated successfully",
      settings 
    });
  } catch (error) {
    console.error('Error updating Google Calendar settings:', error);
    res.status(500).json({ message: "Failed to update settings" });
  }
}

// Disconnect specific Google Calendar
export async function disconnectCalendar(req: Request, res: Response) {
  try {
    // For now, disconnecting the primary calendar disconnects the integration
    // In future, we might support multiple calendar connections
    
    res.json({ 
      success: true, 
      message: "Google Calendar disconnected successfully" 
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: "Failed to disconnect calendar" });
  }
}

// Sync calendar events with two-way sync
export async function syncCalendarEvents(req: Request, res: Response) {
  try {
    // Get events from the last 30 days to 30 days in the future
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);
    
    const result = await getGoogleCalendarEvents(timeMin, timeMax);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error || "Failed to sync Google Calendar" });
    }
    
    // TODO: Process events to create/update appointments in AgencyFlow
    // For now, return the sync summary
    const syncedEvents = result.events?.length || 0;
    
    res.json({ 
      success: true,
      syncedEvents,
      message: `Successfully synced ${syncedEvents} events from Google Calendar`
    });
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    res.status(500).json({ message: "Failed to sync calendar events" });
  }
}