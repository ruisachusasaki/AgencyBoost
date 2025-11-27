/**
 * Fathom API Service
 * 
 * Fetches meeting recordings from Fathom based on calendar event times.
 * API Documentation: https://developers.fathom.ai/quickstart
 */

interface FathomMeeting {
  id: string;
  title: string;
  meeting_title?: string;
  url: string;
  share_url: string;
  created_at: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  meeting_type?: string;
  transcript_language?: string;
  calendar_invitees?: Array<{
    email: string;
    name?: string;
  }>;
  recorded_by?: {
    email: string;
    name?: string;
  };
}

interface FathomMeetingsResponse {
  items: FathomMeeting[];
  next_cursor?: string;
}

/**
 * Find a Fathom recording that matches the given calendar event time
 * 
 * @param apiKey - User's Fathom API key
 * @param eventStartTime - Calendar event start time
 * @param eventEndTime - Calendar event end time
 * @param eventTitle - Calendar event title (optional, for matching)
 * @returns The share URL of the matching Fathom recording, or null if not found
 */
export async function findFathomRecording(
  apiKey: string,
  eventStartTime: Date,
  eventEndTime: Date,
  eventTitle?: string
): Promise<string | null> {
  if (!apiKey) {
    console.log('[Fathom] No API key provided');
    return null;
  }

  try {
    // Search for recordings around the event time
    // Add 30 minutes buffer before and after to account for timing differences
    const searchStart = new Date(eventStartTime.getTime() - 30 * 60 * 1000);
    const searchEnd = new Date(eventEndTime.getTime() + 30 * 60 * 1000);

    const params = new URLSearchParams({
      created_after: searchStart.toISOString(),
      created_before: searchEnd.toISOString(),
    });

    console.log('[Fathom] Searching for recordings:', {
      eventTitle,
      eventStartTime: eventStartTime.toISOString(),
      eventEndTime: eventEndTime.toISOString(),
      searchWindow: {
        from: searchStart.toISOString(),
        to: searchEnd.toISOString(),
      },
    });

    const response = await fetch(
      `https://api.fathom.ai/external/v1/meetings?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Fathom] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return null;
    }

    const data: FathomMeetingsResponse = await response.json();
    console.log('[Fathom] Found meetings:', data.items?.length || 0);

    if (!data.items || data.items.length === 0) {
      console.log('[Fathom] No recordings found in the time window');
      return null;
    }

    // Try to find the best matching recording
    // First, try to match by title if provided
    if (eventTitle) {
      const titleMatch = data.items.find((meeting) => {
        const meetingTitle = (meeting.meeting_title || meeting.title || '').toLowerCase();
        const searchTitle = eventTitle.toLowerCase();
        return meetingTitle.includes(searchTitle) || searchTitle.includes(meetingTitle);
      });

      if (titleMatch) {
        console.log('[Fathom] Found title match:', {
          recordingTitle: titleMatch.title,
          shareUrl: titleMatch.share_url,
        });
        return titleMatch.share_url || titleMatch.url;
      }
    }

    // If no title match, find the recording closest to the event start time
    let closestRecording: FathomMeeting | null = null;
    let closestTimeDiff = Infinity;

    for (const meeting of data.items) {
      const recordingStart = meeting.recording_start_time 
        ? new Date(meeting.recording_start_time)
        : new Date(meeting.created_at);
      
      const timeDiff = Math.abs(recordingStart.getTime() - eventStartTime.getTime());
      
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        closestRecording = meeting;
      }
    }

    if (closestRecording) {
      // Only use if within 1 hour of event start
      if (closestTimeDiff <= 60 * 60 * 1000) {
        console.log('[Fathom] Found closest recording:', {
          recordingTitle: closestRecording.title,
          shareUrl: closestRecording.share_url,
          timeDiff: `${Math.round(closestTimeDiff / 1000 / 60)} minutes`,
        });
        return closestRecording.share_url || closestRecording.url;
      } else {
        console.log('[Fathom] Closest recording too far from event time:', {
          timeDiff: `${Math.round(closestTimeDiff / 1000 / 60)} minutes`,
        });
      }
    }

    return null;
  } catch (error) {
    console.error('[Fathom] Error fetching recordings:', error);
    return null;
  }
}

/**
 * Validate a Fathom API key by making a test request
 * 
 * @param apiKey - User's Fathom API key
 * @returns True if the API key is valid, false otherwise
 */
export async function validateFathomApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch(
      'https://api.fathom.ai/external/v1/meetings?created_after=' + new Date().toISOString(),
      {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Fathom] Error validating API key:', error);
    return false;
  }
}
