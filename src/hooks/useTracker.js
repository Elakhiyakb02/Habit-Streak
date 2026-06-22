import { useState, useEffect, useMemo } from "react";
import { storage, exportData, importData } from "../lib/storage.js";
import { fmt } from "../lib/dates.js";
import { computeCurrentStreak, computeBestStreak, isMilestoneStreak } from "../lib/streak.js";
import { computeWeightStats } from "../lib/weight.js";

const STORAGE_KEY = "habit-tracker-v1";

// A custom hook = a reusable function (name starts with "use") that bundles
// state + logic. This one is the app's "data brain": every component gets its
// data and actions from here, and never touches storage directly.
export function useTracker() {
  const [days, setDays] = useState({});
  const [celebrated, setCelebrated] = useState([]); // milestone streaks already shown
  const [loading, setLoading] = useState(true);

  const tKey = fmt(new Date());

  // Load saved data once when the app starts.
  useEffect(() => {
    (async () => {
      const res = await storage.get(STORAGE_KEY);
      if (res && res.value) {
        try {
          const parsed = JSON.parse(res.value);
          setDays(parsed.days || {});
          setCelebrated(parsed.celebrated || []);
        } catch {
          /* corrupt — start fresh */
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = (nextDays, nextCelebrated) =>
    storage.set(STORAGE_KEY, JSON.stringify({ days: nextDays, celebrated: nextCelebrated }));

  // Toggle a habit on a given day. Returns a celebration "event" the UI can act
  // on ({type:"workout"} | {type:"milestone", value} | null). Only fires for today.
  function toggleHabit(dayKey, habitKey) {
    const entry = { ...(days[dayKey] || {}) };
    const willBeOn = !entry[habitKey];
    entry[habitKey] = willBeOn;
    const next = { ...days, [dayKey]: entry };

    let nextCelebrated = celebrated;
    let event = null;

    if (dayKey === tKey) {
      if (habitKey === "workout") {
        if (willBeOn) event = { type: "workout" };
      } else if (willBeOn) {
        const s = computeCurrentStreak(next, tKey);
        if (isMilestoneStreak(s) && !celebrated.includes(s)) {
          nextCelebrated = [...celebrated, s];
          event = { type: "milestone", value: s };
        }
      }
    }

    setDays(next);
    setCelebrated(nextCelebrated);
    persist(next, nextCelebrated);
    return event;
  }

  function setWeight(dayKey, raw) {
    const w = parseFloat(raw);
    if (!w || w < 30 || w > 200) return false;
    const next = { ...days, [dayKey]: { ...(days[dayKey] || {}), weight: w } };
    setDays(next);
    persist(next, celebrated);
    return true;
  }

  async function restoreFromText(text) {
    importData(text);
    const res = await storage.get(STORAGE_KEY);
    if (res?.value) {
      const parsed = JSON.parse(res.value);
      setDays(parsed.days || {});
      setCelebrated(parsed.celebrated || []);
    }
  }

  const streak = useMemo(
    () => ({ current: computeCurrentStreak(days, tKey), best: computeBestStreak(days, tKey) }),
    [days, tKey]
  );
  const weightStats = useMemo(() => computeWeightStats(days), [days]);

  return {
    days,
    loading,
    todayKey: tKey,
    streak,
    weightStats,
    toggleHabit,
    setWeight,
    backup: exportData,
    restoreFromText,
  };
}
