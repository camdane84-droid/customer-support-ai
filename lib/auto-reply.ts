/**
 * Auto-reply schedule helper.
 * Determines whether an incoming customer message should receive an AI auto-reply
 * based on business settings (enabled flag, subscription tier, schedule mode/hours).
 */

interface Business {
  auto_reply_enabled?: boolean;
  subscription_tier?: string;
  auto_reply_mode?: 'after_hours' | 'all_day' | 'custom';
  auto_reply_start?: string; // HH:MM format
  auto_reply_end?: string;   // HH:MM format
}

/**
 * Check if auto-reply should fire for this business right now.
 * Returns false if disabled, not Pro, or outside the configured schedule.
 */
export function shouldAutoReply(business: Business): boolean {
  if (!business.auto_reply_enabled) return false;
  if (business.subscription_tier !== 'pro') return false;

  const mode = business.auto_reply_mode || 'after_hours';

  if (mode === 'all_day') return true;

  // Both 'after_hours' and 'custom' use the start/end times
  const start = business.auto_reply_start || '18:00';
  const end = business.auto_reply_end || '06:00';

  return isWithinSchedule(start, end);
}

/**
 * Check if the current UTC time falls within the start–end window.
 * Handles overnight ranges (e.g. 18:00–06:00) where end < start.
 */
function isWithinSchedule(start: string, end: string): boolean {
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);

  if (startMinutes <= endMinutes) {
    // Same-day range (e.g. 09:00–17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g. 18:00–06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

/** Parse "HH:MM" into total minutes since midnight. */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}
