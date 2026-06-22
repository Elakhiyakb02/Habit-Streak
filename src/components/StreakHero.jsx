import React from "react";
import { Flame, Trophy } from "lucide-react";

// Presentational component: just shows the numbers it's given.
export default function StreakHero({ current, best }) {
  return (
    <div className="rounded-3xl bg-stone-900 text-amber-50 p-6 mb-5 shadow-sm">
      <div className="flex items-center gap-4">
        <Flame className={current > 0 ? "text-amber-400" : "text-stone-600"} size={44} strokeWidth={2.2} />
        <div>
          <div className="text-5xl font-black leading-none tabular-nums">{current}</div>
          <div className="text-sm text-amber-200/80 mt-1">
            day streak {current > 0 ? "🔥" : "— start it today"}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="flex items-center justify-end gap-1 text-amber-300">
            <Trophy size={16} />
            <span className="text-xl font-bold tabular-nums">{best}</span>
          </div>
          <div className="text-[11px] text-amber-200/60">best</div>
        </div>
      </div>
    </div>
  );
}
