import React from "react";
import { Check, Dumbbell } from "lucide-react";
import { CORE, HOLD_THRESHOLD, dayHeld } from "../lib/habits.js";
import { HABIT_ICONS } from "./habitIcons.js";
import { dayLabel } from "../lib/dates.js";

export default function DayChecklist({ dayKey, entry, isToday, onToggle, onBackToToday }) {
  const score = dayHeld(entry);
  const status = isToday
    ? score >= 4
      ? "perfect"
      : score >= HOLD_THRESHOLD
      ? "secured"
      : "in progress"
    : score >= 4
    ? "perfect"
    : score >= HOLD_THRESHOLD
    ? "held"
    : "missed";

  return (
    <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-stone-800">{dayLabel(dayKey)}</h2>
          {!isToday && (
            <button
              onClick={onBackToToday}
              className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-200"
            >
              ← Today
            </button>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            score >= 4
              ? "bg-emerald-100 text-emerald-700"
              : score >= HOLD_THRESHOLD
              ? "bg-amber-100 text-amber-700"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          {score}/4 · {status}
        </span>
      </div>

      <div className="space-y-2">
        {CORE.map(({ key, label }) => {
          const Icon = HABIT_ICONS[key];
          const on = !!entry[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                on ? "bg-emerald-500 text-white" : "bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {Icon && <Icon size={20} strokeWidth={2.2} />}
              <span className="font-medium flex-1">{label}</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${on ? "bg-white/25" : "border-2 border-stone-300"}`}>
                {on && <Check size={15} strokeWidth={3} />}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => onToggle("workout")}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition border-2 border-dashed ${
            entry.workout ? "bg-amber-400 border-amber-400 text-stone-900" : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          <Dumbbell size={20} strokeWidth={2.2} />
          <span className="font-medium flex-1">
            Workout <span className="text-xs opacity-70">(bonus)</span>
          </span>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${entry.workout ? "bg-white/30" : "border-2 border-stone-300"}`}>
            {entry.workout && <Check size={15} strokeWidth={3} />}
          </span>
        </button>
      </div>
    </div>
  );
}
