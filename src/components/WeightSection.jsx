import React, { useState } from "react";
import { dayLabel } from "../lib/dates.js";

// Small inline SVG trend line of recent weigh-ins.
function Sparkline({ series }) {
  if (series.length < 2) return null;
  const vals = series.map((s) => s.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 280;
  const H = 54;
  const pad = 6;
  const n = vals.length;
  const pts = vals.map((v, i) => {
    const x = pad + (i * (W - 2 * pad)) / (n - 1);
    const y = pad + (H - 2 * pad) * (1 - (v - min) / range);
    return [x, y];
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const last = pts[pts.length - 1];
  return (
    <div className="mb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 54 }}>
        <polyline points={line} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="#d97706" />
      </svg>
      <div className="flex justify-between text-[10px] text-stone-400">
        <span>{series.length} recent weigh-ins</span>
        <span className="tabular-nums">low {min.toFixed(1)} · high {max.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function WeightSection({ stats, selectedEntry, selectedKey, onLog }) {
  const [input, setInput] = useState("");

  const submit = () => {
    if (onLog(input)) setInput("");
  };

  return (
    <div className="rounded-3xl bg-white p-6 mb-5 shadow-sm border border-stone-100">
      <h2 className="font-bold text-stone-800 mb-4">Weight</h2>

      {stats.last ? (
        <>
          <div className="flex items-stretch gap-4 mb-5">
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">Last logged</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tabular-nums text-stone-900">{stats.last.value.toFixed(1)}</span>
                <span className="text-base font-semibold text-stone-400">kg</span>
              </div>
              <div className="text-xs text-stone-400 mt-1">{dayLabel(stats.last.key)}</div>
            </div>
            <div className="w-px bg-stone-100" />
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">7-day average</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tabular-nums text-amber-600">
                  {stats.avg7 != null ? stats.avg7.toFixed(1) : "–"}
                </span>
                <span className="text-base font-semibold text-amber-400">kg</span>
              </div>
              <div className="text-xs text-stone-400 mt-1">
                {stats.avg7Count} weigh-in{stats.avg7Count === 1 ? "" : "s"} this week
              </div>
            </div>
          </div>

          <Sparkline series={stats.series} />
        </>
      ) : (
        <p className="text-sm text-stone-400 mb-4">No weigh-ins yet — log your first below.</p>
      )}

      <div className="flex gap-2 mt-4">
        <input
          type="number"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedEntry.weight
              ? `${selectedEntry.weight} kg on ${dayLabel(selectedKey).toLowerCase()}`
              : `log ${dayLabel(selectedKey).toLowerCase()} (kg)`
          }
          className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button onClick={submit} className="rounded-xl bg-stone-900 text-amber-50 px-5 py-3 text-sm font-semibold hover:bg-stone-800">
          Log
        </button>
      </div>
      <p className="text-xs text-stone-400 mt-3">Judge by the average, never a single morning.</p>
    </div>
  );
}
