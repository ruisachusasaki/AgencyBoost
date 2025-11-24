// Google Calendar Availability Checking
import { db } from './db';
import { 
  calendarConnections, 
  calendarEvents,
  calendarEventCache,
  calendarAppointments,
  staff
} from '@shared/schema';
import { eq, and, or, lte, gte, ne, sql } from 'drizzle-orm';
import { incrementalSync } from './googleCalendarIncrementalSync';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityCheck {
  isAvailable: boolean;
  conflicts?: Array<{
    title: string;
    start: Date;
    end: Date;
    source: 'google' | 'agencyflow';
  }>;
}

export class GoogleCalendarAvailability {
  
  // Check if a specific time slot is available for a user
  async checkUserAvailability(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<AvailabilityCheck> {
    const conflicts: AvailabilityCheck['conflicts'] = [];

    // Check Google Calendar conflicts
    const googleConflicts = await this.checkGoogleCalendarConflicts(userId, startTime, endTime);
    if (googleConflicts.length > 0) {
      conflicts.push(...googleConflicts.map(c => ({
        ...c,
        source: 'google' as const
      })));
    }

    // Check AgencyFlow appointments
    const agencyFlowConflicts = await this.checkAgencyFlowConflicts(
      userId, 
      startTime, 
      endTime,
      excludeAppointmentId
    );
    if (agencyFlowConflicts.length > 0) {
      conflicts.push(...agencyFlowConflicts.map(c => ({
        ...c,
        source: 'agencyflow' as const
      })));
    }

    return {
      isAvailable: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  }

  // Check Google Calendar for conflicts
  private async checkGoogleCalendarConflicts(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ title: string; start: Date; end: Date }>> {
    // First check the cache for quick availability
    const dateStr = startTime.toISOString().split('T')[0];
    const cache = await db
      .select()
      .from(calendarEventCache)
      .where(
        and(
          eq(calendarEventCache.userId, userId),
          eq(calendarEventCache.date, dateStr)
        )
      )
      .limit(1);

    if (cache.length > 0) {
      // Use cached busy slots
      const busySlots = cache[0].busySlots as Array<{ start: string; end: string }>;
      const conflicts: Array<{ title: string; start: Date; end: Date }> = [];

      for (const slot of busySlots) {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);

        // Check for overlap
        if (startTime < slotEnd && endTime > slotStart) {
          conflicts.push({
            title: 'Busy (Google Calendar)',
            start: slotStart,
            end: slotEnd
          });
        }
      }

      return conflicts;
    }

    // Cache miss - query the database directly
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.syncEnabled, true)
        )
      );

    if (connections.length === 0) {
      return [];
    }

    // Get all conflicting Google Calendar events
    const conflictingEvents = await db
      .select({
        summary: calendarEvents.summary,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        transparency: calendarEvents.transparency,
        status: calendarEvents.status
      })
      .from(calendarEvents)
      .where(
        and(
          sql`${calendarEvents.connectionId} IN (${sql.join(connections.map(c => sql`${c.id}`), sql`, `)})`,
          lte(calendarEvents.startTime, endTime),
          gte(calendarEvents.endTime, startTime),
          eq(calendarEvents.transparency, 'opaque'), // Only busy events
          ne(calendarEvents.status, 'cancelled')
        )
      );

    return conflictingEvents.map(event => ({
      title: event.summary || 'Busy',
      start: event.startTime,
      end: event.endTime
    }));
  }

  // Check AgencyFlow appointments for conflicts
  private async checkAgencyFlowConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<Array<{ title: string; start: Date; end: Date }>> {
    const query = db
      .select({
        title: calendarAppointments.title,
        startTime: calendarAppointments.startTime,
        endTime: calendarAppointments.endTime,
        status: calendarAppointments.status
      })
      .from(calendarAppointments)
      .where(
        and(
          eq(calendarAppointments.assignedTo, userId),
          lte(calendarAppointments.startTime, endTime),
          gte(calendarAppointments.endTime, startTime),
          ne(calendarAppointments.status, 'cancelled')
        )
      );

    // Exclude specific appointment if provided (for updates)
    if (excludeAppointmentId) {
      query.where(
        and(
          eq(calendarAppointments.assignedTo, userId),
          lte(calendarAppointments.startTime, endTime),
          gte(calendarAppointments.endTime, startTime),
          ne(calendarAppointments.status, 'cancelled'),
          ne(calendarAppointments.id, excludeAppointmentId)
        )
      );
    }

    const conflicts = await query;

    return conflicts.map(appointment => ({
      title: appointment.title,
      start: appointment.startTime,
      end: appointment.endTime
    }));
  }

  // Get available time slots for a date
  async getAvailableSlots(
    userId: string,
    date: Date,
    slotDurationMinutes: number = 30,
    businessHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
  ): Promise<TimeSlot[]> {
    const availableSlots: TimeSlot[] = [];
    
    // Set up the day boundaries
    const dayStart = new Date(date);
    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    const [endHour, endMinute] = businessHours.end.split(':').map(Number);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Get all busy times for this day
    const busyTimes = await this.getBusyTimesForDay(userId, date);

    // Sort busy times by start time
    busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Generate available slots
    let currentTime = new Date(dayStart);

    for (const busy of busyTimes) {
      // Add available slots before this busy period
      while (currentTime < busy.start && currentTime < dayEnd) {
        const slotEnd = new Date(currentTime);
        slotEnd.setMinutes(currentTime.getMinutes() + slotDurationMinutes);

        if (slotEnd <= busy.start && slotEnd <= dayEnd) {
          availableSlots.push({
            start: new Date(currentTime),
            end: new Date(slotEnd)
          });
        }

        currentTime.setMinutes(currentTime.getMinutes() + slotDurationMinutes);
      }

      // Move current time to end of busy period
      if (busy.end > currentTime) {
        currentTime = new Date(busy.end);
      }
    }

    // Add remaining slots after last busy period
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(currentTime.getMinutes() + slotDurationMinutes);

      if (slotEnd <= dayEnd) {
        availableSlots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd)
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDurationMinutes);
    }

    return availableSlots;
  }

  // Get all busy times for a specific day
  private async getBusyTimesForDay(
    userId: string,
    date: Date
  ): Promise<TimeSlot[]> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const busyTimes: TimeSlot[] = [];

    // Get Google Calendar busy times
    const googleBusy = await this.checkGoogleCalendarConflicts(userId, dayStart, dayEnd);
    busyTimes.push(...googleBusy.map(b => ({ start: b.start, end: b.end })));

    // Get AgencyFlow appointment busy times
    const agencyFlowBusy = await this.checkAgencyFlowConflicts(userId, dayStart, dayEnd);
    busyTimes.push(...agencyFlowBusy.map(b => ({ start: b.start, end: b.end })));

    // Merge overlapping time slots
    return this.mergeOverlappingSlots(busyTimes);
  }

  // Merge overlapping time slots
  private mergeOverlappingSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length === 0) return [];

    // Sort by start time
    slots.sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: TimeSlot[] = [slots[0]];

    for (let i = 1; i < slots.length; i++) {
      const current = slots[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        // Overlapping - merge
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      } else {
        // Non-overlapping - add as new slot
        merged.push(current);
      }
    }

    return merged;
  }

  // Validate appointment time before booking
  async validateAppointmentTime(
    appointmentData: {
      assignedTo: string;
      startTime: Date;
      endTime: Date;
      id?: string;
    }
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check availability
    const availability = await this.checkUserAvailability(
      appointmentData.assignedTo,
      appointmentData.startTime,
      appointmentData.endTime,
      appointmentData.id
    );

    if (!availability.isAvailable) {
      const conflictDetails = availability.conflicts
        ?.map(c => `${c.title} (${c.start.toLocaleTimeString()} - ${c.end.toLocaleTimeString()})`)
        .join(', ');

      return {
        valid: false,
        reason: `Time slot conflicts with: ${conflictDetails}`
      };
    }

    // Additional validation rules
    const now = new Date();
    if (appointmentData.startTime < now) {
      return {
        valid: false,
        reason: 'Cannot book appointments in the past'
      };
    }

    if (appointmentData.endTime <= appointmentData.startTime) {
      return {
        valid: false,
        reason: 'End time must be after start time'
      };
    }

    const durationMs = appointmentData.endTime.getTime() - appointmentData.startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours > 8) {
      return {
        valid: false,
        reason: 'Appointment duration cannot exceed 8 hours'
      };
    }

    return { valid: true };
  }

  // Update cache for a user after changes
  async refreshUserCache(userId: string) {
    const sync = new incrementalSync.constructor();
    
    // Get all connections for this user
    const connections = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.userId, userId));

    // Refresh cache for next 7 days
    for (const connection of connections) {
      await incrementalSync.syncUserCalendar(connection.id);
    }
  }
}

export const availabilityChecker = new GoogleCalendarAvailability();