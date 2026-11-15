/**
 * Login calendar: one gift per day, seven in a row with the biggest last.
 * A missed day costs nothing – the calendar simply waits on the same box.
 */
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export const CALENDAR_REWARDS = [10, 15, 20, 25, 30, 40, 80];

export interface CalendarState {
  /** Boxes opened in the current round, 0–6 (the round restarts after the seventh). */
  opened: number;
  /** Date key of the last day a box was opened. */
  lastClaim?: string;
}

export function sanitizeCalendar(raw: unknown): CalendarState {
  if (raw && typeof raw === 'object') {
    const src = raw as Record<string, unknown>;
    if (typeof src.opened === 'number' && Number.isFinite(src.opened)) {
      return {
        opened: Math.max(0, Math.floor(src.opened)) % CALENDAR_REWARDS.length,
        ...(typeof src.lastClaim === 'string' ? { lastClaim: src.lastClaim } : {}),
      };
    }
  }
  return { opened: 0 };
}

export function canClaimCalendar(state: CalendarState, todayKey: string): boolean {
  return state.lastClaim !== todayKey;
}

/** Opens today's box. `energy` is 0 when it was already opened today. */
export function claimCalendar(state: CalendarState, todayKey: string): { nextState: CalendarState; energy: number } {
  if (!canClaimCalendar(state, todayKey)) return { nextState: state, energy: 0 };
  return {
    nextState: { opened: (state.opened + 1) % CALENDAR_REWARDS.length, lastClaim: todayKey },
    energy: CALENDAR_REWARDS[state.opened],
  };
}

/**
 * How many boxes to show as opened. Right after the seventh box the round
 * still shows as full for the rest of that day.
 */
export function calendarShown(state: CalendarState, todayKey: string): number {
  return state.opened === 0 && state.lastClaim === todayKey ? CALENDAR_REWARDS.length : state.opened;
}

export function readCalendar(): CalendarState {
  return sanitizeCalendar(readJson(STORAGE_KEYS.calendar));
}

export function writeCalendar(state: CalendarState): void {
  writeJson(STORAGE_KEYS.calendar, state);
}
