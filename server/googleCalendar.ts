import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Check if Google Calendar is connected
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const token = await getAccessToken();
    console.log('Google Calendar connection check - token exists:', !!token);
    return true;
  } catch (error) {
    console.log('Google Calendar connection check - error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Sync appointment to Google Calendar
export async function syncAppointmentToGoogleCalendar(appointment: {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendeeEmails?: string[];
  googleEventId?: string;
}) {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const event = {
      summary: appointment.title,
      description: appointment.description,
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      location: appointment.location,
      attendees: appointment.attendeeEmails?.map(email => ({ email })),
    };

    let result;
    if (appointment.googleEventId) {
      // Update existing event
      result = await calendar.events.update({
        calendarId: 'primary',
        eventId: appointment.googleEventId,
        requestBody: event,
      });
    } else {
      // Create new event
      result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
    }

    return {
      success: true,
      googleEventId: result.data.id,
      htmlLink: result.data.htmlLink,
    };
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Delete appointment from Google Calendar
export async function deleteAppointmentFromGoogleCalendar(googleEventId: string) {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting from Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get calendar events for a time range
export async function getGoogleCalendarEvents(startTime: Date, endTime: Date) {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return {
      success: true,
      events: response.data.items || [],
    };
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}