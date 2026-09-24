export interface SendWindow {
  timezone: string;
  /** Local hour [0,23] the window opens (inclusive). */
  startHour: number;
  /** Local hour [1,24] the window closes (exclusive). */
  endHour: number;
  /** ISO weekdays allowed, 1 = Mon … 7 = Sun. */
  days: number[];
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function localParts(date: Date, timezone: string): { weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: WEEKDAYS[get("weekday")] ?? 1, hour: Number(get("hour")) % 24, minute: Number(get("minute")) };
}

export function isWithinSendWindow(now: Date, window: SendWindow): boolean {
  const { weekday, hour } = localParts(now, window.timezone);
  return window.days.includes(weekday) && hour >= window.startHour && hour < window.endHour;
}

/** Next instant (15-min resolution) the window is open; `now` if open. */
export function nextWindowOpen(now: Date, window: SendWindow): Date | null {
  if (window.days.length === 0 || window.startHour >= window.endHour) return null;
  let t = new Date(now);
  for (let i = 0; i < 4 * 24 * 8; i++) {
    if (isWithinSendWindow(t, window)) return t;
    t = new Date(Math.floor(t.getTime() / 900_000) * 900_000 + 900_000);
  }
  return null;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** When the step after `sentStep` is due, or null if the sequence is done. */
export function nextStepDueAt(
  sequence: Array<{ step: number; dayOffset: number }>,
  sentStep: number,
  sentAt: Date
): Date | null {
  const current = sequence.find((s) => s.step === sentStep);
  const next = sequence.find((s) => s.step === sentStep + 1);
  if (!current || !next) return null;
  return new Date(sentAt.getTime() + (next.dayOffset - current.dayOffset) * 86_400_000);
}
