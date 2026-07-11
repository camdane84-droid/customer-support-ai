/**
 * New-message notification chime, shared by the dashboard inbox and the
 * chat widget. Browser-only; throttled so a burst of messages plays once.
 */

let audio: HTMLAudioElement | null = null;
let lastPlayedAt = 0;
const THROTTLE_MS = 1500;

export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastPlayedAt < THROTTLE_MS) return;
  lastPlayedAt = now;

  try {
    if (!audio) {
      audio = new Audio('/sounds/new-message.mp3');
      audio.volume = 0.6;
    }
    audio.currentTime = 0;
    // Browsers reject play() before the user's first interaction — fine to drop
    audio.play().catch(() => {});
  } catch {
    // Audio unsupported — silently skip
  }
}
