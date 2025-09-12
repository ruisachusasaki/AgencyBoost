import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Check if it's a US number (10 or 11 digits)
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // For other formats, just return the original
  return phone;
}

/**
 * Formats a date as M/D/YY (no leading zeros for month/day, 2-digit year)
 * Example: 9/8/25
 */
export function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  const year = date.getFullYear() % 100; // Get 2-digit year
  return `${month}/${day}/${year.toString().padStart(2, '0')}`;
}

/**
 * Formats a Monday-Sunday week range as (M/D/YY - M/D/YY)
 * Example: (9/8/25 - 9/14/25)
 */
export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  return `(${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)})`;
}

/**
 * Gets the Monday-Sunday week range for any given date
 * Returns the start date (Monday), end date (Sunday), and formatted display string
 */
export function getWeekRange(date: Date): { weekStart: Date, weekEnd: Date, displayRange: string } {
  const inputDate = new Date(date);
  
  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = inputDate.getDay();
  
  // Calculate how many days to subtract to get to Monday
  // If it's Sunday (0), we need to go back 6 days to get to Monday
  // If it's Monday (1), we need to go back 0 days
  // If it's Tuesday (2), we need to go back 1 day, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Calculate the Monday of this week
  const weekStart = new Date(inputDate);
  weekStart.setDate(inputDate.getDate() - daysToMonday);
  
  // Calculate the Sunday of this week (Monday + 6 days)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const displayRange = formatWeekRange(weekStart, weekEnd);
  
  return {
    weekStart,
    weekEnd,
    displayRange
  };
}

/**
 * Gets the Monday-Sunday week range for the current date
 * Returns the start date (Monday), end date (Sunday), and formatted display string
 */
export function getCurrentWeekRange(): { weekStart: Date, weekEnd: Date, displayRange: string } {
  return getWeekRange(new Date());
}
