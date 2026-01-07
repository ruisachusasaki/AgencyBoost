import { useQuery } from "@tanstack/react-query";

interface BusinessTimezoneResponse {
  timezone: string;
}

export function useBusinessTimezone() {
  const { data, isLoading, error } = useQuery<BusinessTimezoneResponse>({
    queryKey: ['/api/business-timezone'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    timezone: data?.timezone || "America/New_York",
    isLoading,
    error
  };
}

export function formatDateInTimezone(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { timeZone: timezone });
}

export function formatTimeInTimezone(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { 
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTimeInTimezone(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { timeZone: timezone });
}

export function getLocalDateString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

export function getTodayInTimezone(timezone: string): string {
  return getLocalDateString(new Date(), timezone);
}

function getDatePartsInTimezone(date: Date, timezone: string): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  
  const parts = formatter.formatToParts(date);
  const weekdayAbbr = parts.find(p => p.type === 'weekday')?.value || '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return {
    year: parseInt(parts.find(p => p.type === 'year')?.value || '0', 10),
    month: parseInt(parts.find(p => p.type === 'month')?.value || '0', 10),
    day: parseInt(parts.find(p => p.type === 'day')?.value || '0', 10),
    weekday: weekdays.indexOf(weekdayAbbr)
  };
}

function addDaysToDateInTimezone(year: number, month: number, day: number, daysToAdd: number): string {
  const date = new Date(Date.UTC(year, month - 1, day + daysToAdd, 12, 0, 0));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStartOfWeekInTimezone(timezone: string): string {
  const now = new Date();
  const { year, month, day, weekday } = getDatePartsInTimezone(now, timezone);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateInTimezone(year, month, day, diff);
}

export function getEndOfWeekInTimezone(timezone: string): string {
  const now = new Date();
  const { year, month, day, weekday } = getDatePartsInTimezone(now, timezone);
  const diff = weekday === 0 ? 0 : 7 - weekday;
  return addDaysToDateInTimezone(year, month, day, diff);
}
