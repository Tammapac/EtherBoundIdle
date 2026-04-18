import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Smart polling hook that reduces API calls based on tab visibility and user activity.
 *
 * Returns an adjusted interval (in ms) for use with refetchInterval.
 * - When tab is hidden: returns false (stops polling entirely)
 * - When user is idle (no interaction for idleThreshold): returns slowInterval
 * - When user is active: returns the base interval
 *
 * Usage:
 *   const interval = useSmartPolling(15000);  // 15s base
 *   useQuery({ ..., refetchInterval: interval });
 */

const IDLE_THRESHOLD = 60_000; // 1 minute without interaction = idle
const listeners = new Set();
let isVisible = typeof document !== "undefined" ? !document.hidden : true;
let lastActivity = Date.now();

// Global visibility + activity listeners (shared across all hook instances)
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
    if (isVisible) lastActivity = Date.now();
    listeners.forEach((fn) => fn());
  });

  const onActivity = () => {
    lastActivity = Date.now();
    // Don't notify on every keystroke — debounced via the interval checks
  };
  document.addEventListener("mousedown", onActivity, { passive: true });
  document.addEventListener("keydown", onActivity, { passive: true });
  document.addEventListener("touchstart", onActivity, { passive: true });
  document.addEventListener("scroll", onActivity, { passive: true });
}

export function useSmartPolling(baseInterval, { slowMultiplier = 3 } = {}) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => forceUpdate((n) => n + 1);
    listeners.add(update);

    // Check idle state periodically
    const timer = setInterval(update, 10_000);

    return () => {
      listeners.delete(update);
      clearInterval(timer);
    };
  }, []);

  if (baseInterval === false) return false; // Polling disabled entirely
  if (!isVisible) return false; // Stop polling when tab is hidden

  const idleTime = Date.now() - lastActivity;
  if (idleTime > IDLE_THRESHOLD) {
    return Math.min(baseInterval * slowMultiplier, 120_000); // Cap at 2 minutes
  }

  return baseInterval;
}

/**
 * Pre-configured polling intervals for common use cases.
 * All values are in milliseconds.
 */
export const POLL_INTERVALS = {
  COMBAT:    15_000,  // Active combat (portal, dungeon, world boss)
  SOCIAL:    30_000,  // Chat, friends, party
  GAME_STATE: 60_000, // Dashboard, inventory, guild
  BACKGROUND: false,  // Leaderboard, season pass, admin — manual refresh only
};
