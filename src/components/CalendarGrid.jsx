import React, { useMemo } from "react";
import { fmt, addDays } from "../lib/dates.js";
import { dayHeld, HOLD_THRESHOLD } from "../lib/habits.js";

function cellClass(c) {
  let fill;
  if (c.isToday) {
    fill = c.score >= 4 ? "bg-emerald-500" : c.score >= HOLD_THRESHOLD ? "bg-amber-400" : "bg-amber-200";
  } else if (!c.logged) {
    fill = "bg-stone-200/60";
  } else if (c.score >= 4) {
    fill = "bg-emerald-500";
  } else if (c.score >= HOLD_THRESHOLD) {
    fill = "bg-amber-400";
  } else {
    fill = "bg-rose-300";
  }
  let ring = "";
  if (c.isSelected) ring = c.isToday ? " ring-2 ring-amber-500" : " ring-2 ring-stone-800";
  else if (c.isToday) ring = " ring-2 ring-amber-400";
  return fill + ring;
}

export default function CalendarGrid({ days, todayKey, selectedKey, onSelect }) {
  const grid = useMemo(() => {
    const arr = [];
    for (let i = 34; i >= 0; i--) {
      const k = fmt(addDays(new Date(), -i));
      arr.push({
        k,
        score: dayHeld(days[k]),
        logged: !!days[k],
        isToday: k === todayKey,
        isSelected: k === selectedKey,
        workout: !!(days[k] && days[k].workout),
      });
    }
    return arr;
  }, [days, todayKey, selectedKey]);

  return (
    <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-stone-800">Last 5 weeks</h2>
        <span className="text-[11px] text-stone-400">tap a day to edit</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {grid.map((c) => (
          <button
            key={c.k}
            onClick={() => onSelect(c.k)}
            title={`${c.k} · ${c.logged ? c.score + "/4" : "not logged"}${c.workout ? " · workout" : ""}`}
            className={`aspect-square rounded-md flex items-center justify-center transition ${cellClass(c)}`}
          >
            {c.workout && <span style={{ fontSize: "16px", lineHeight: 1 }}>🔥</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-stone-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> 4/4</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> 3/4</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200" /> today</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-300" /> missed</span>
        <span className="flex items-center gap-1">🔥 workout</span>
      </div>
    </div>
  );
}
