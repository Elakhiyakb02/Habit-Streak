import { fmt, addDays } from "./dates.js";
import { dayHeld, HOLD_THRESHOLD } from "./habits.js";

// Current streak: count consecutive held days ending YESTERDAY, then add today
// only if today is already secured. (Today in-progress never breaks the streak.)
export function computeCurrentStreak(days, tKey) {
  let cur = 0;
  let cursor = addDays(new Date(), -1);
  while (dayHeld(days[fmt(cursor)]) >= HOLD_THRESHOLD) {
    cur++;
    cursor = addDays(cursor, -1);
  }
  if (dayHeld(days[tKey]) >= HOLD_THRESHOLD) cur += 1;
  return cur;
}

// Longest run of held days across all history (an in-progress today doesn't reset it).
export function computeBestStreak(days, tKey) {
  const cur = computeCurrentStreak(days, tKey);
  const keys = Object.keys(days).sort();
  let best = cur;
  if (keys.length) {
    let run = 0;
    let d = new Date(keys[0]);
    const end = new Date(tKey);
    while (d <= end) {
      const isToday = fmt(d) === tKey;
      if (dayHeld(days[fmt(d)]) >= HOLD_THRESHOLD) {
        run++;
        if (run > best) best = run;
      } else if (!isToday) {
        run = 0;
      }
      d = addDays(d, 1);
    }
  }
  return best;
}

// Milestone streaks: 7, then every 30 days (7, 30, 60, 90, ...).
export const isMilestoneStreak = (n) => n === 7 || (n >= 30 && n % 30 === 0);

export const milestoneMessage = (n) => {
  if (n === 7) return "One week streak! 🔥";
  if (n === 30) return "30 days! You're unstoppable 🌟";
  if (n === 90) return "90 days — this is who you are now 💪";
  if (n === 180) return "Half a year! Incredible 🏆";
  if (n === 360) return "A whole year. Legend. 👑";
  return `${n}-day streak! 🎉`;
};
