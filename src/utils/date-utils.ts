import { format, startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const TIMEZONE = 'America/Bahia';

/**
 * Returns today's start and end timestamps in America/Bahia timezone,
 * converted back to UTC ISO strings for Supabase queries.
 */
export function getTodayRange() {
  const now = new Date();
  // Get current time in Bahia
  const zonedNow = toZonedTime(now, TIMEZONE);
  
  // Get start and end of day in Bahia time
  const startInBahia = startOfDay(zonedNow);
  const endInBahia = endOfDay(zonedNow);
  
  // Convert those Bahia day boundaries back to UTC for DB filtering
  const startUTC = fromZonedTime(startInBahia, TIMEZONE);
  const endUTC = fromZonedTime(endInBahia, TIMEZONE);
  
  // IMPORTANT: Supabase/PostgREST gte/lte filters expect simple ISO strings
  // We use .toISOString() which provides the UTC reference the DB needs.
  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString(),
  };
}

/**
 * Returns a range for a given number of days back from today (Bahia timezone).
 */
export function getDaysBackRange(days: number) {
  const { end } = getTodayRange();
  const endDate = new Date(end);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0); // Start of that day
  
  // Convert back to UTC for DB
  const startUTC = fromZonedTime(startDate, TIMEZONE);
  
  return {
    start: startUTC.toISOString(),
    end: end,
  };
}

/**
 * Formats a date to ISO while preserving the intended day boundaries in the target timezone.
 */
export function toZonedISO(date: Date) {
  return toZonedTime(date, TIMEZONE).toISOString();
}
