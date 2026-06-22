import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame, Check, Moon, Footprints, Utensils, Dumbbell, Trophy, Download, Upload } from "lucide-react";
import { storage, exportData, importData } from "./lib/storage.js";
import Mascot from "./components/Mascot.jsx";

const STORAGE_KEY = "habit-tracker-v1";

// ---- date helpers (local time) ----
const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const CORE = [
  { key: "protein", label: "Protein every meal", Icon: Utensils },
  { key: "plan", label: "Stayed within plan", Icon: Check },
  { key: "walk", label: "Walked / moved", Icon: Footprints },
  { key: "sleep", label: "Lights out by 11", Icon: Moon },
];
const HOLD_THRESHOLD = 3;
const dayHeld = (e) => (e ? CORE.filter((c) => e[c.key]).length : 0);

// Milestone streaks: 7, then every 30 days (7, 30, 60, 90, ...).
const isMilestoneStreak = (n) => n === 7 || (n >= 30 && n % 30 === 0);
const milestoneMessage = (n) => {
  if (n === 7) return "One week streak! 🔥";
  if (n === 30) return "30 days! You're unstoppable 🌟";
  if (n === 90) return "90 days — this is who you are now 💪";
  if (n === 180) return "Half a year! Incredible 🏆";
  if (n === 360) return "A whole year. Legend. 👑";
  return `${n}-day streak! 🎉`;
};

const CHEERS = ["Workout done! 💪", "Crushed it! 🔥", "Look at you go! ✨", "Beast mode 💪", "Proud of you! 🌟"];
const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#fde047"];

const celebrationCss = `
.celebrate-root{position:fixed;inset:0;z-index:50;overflow:hidden;pointer-events:auto;cursor:pointer;}
.cel-backdrop{position:absolute;inset:0;background:rgba(255,255,255,.5);animation:cel-fade .25s ease both;}
.confetti{position:absolute;top:-14px;border-radius:2px;opacity:0;
  animation-name:confetti-fall;animation-timing-function:cubic-bezier(.25,.7,.4,1);animation-fill-mode:forwards;}
@keyframes confetti-fall{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(106vh) rotate(720deg)}}
.cel-mascot{position:absolute;left:50%;bottom:16%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:12px;animation:cel-pop .35s ease-out both;}
.cel-bubble{background:#1c1917;color:#fef3c7;
  font-family:'Fredoka','ui-rounded',system-ui,sans-serif;font-weight:600;font-size:17px;letter-spacing:.3px;
  padding:9px 18px;border-radius:9999px;box-shadow:0 8px 22px rgba(0,0,0,.28);white-space:nowrap;
  animation:bubble-bob 1.1s ease-in-out infinite;}
.cel-skip{position:absolute;bottom:6%;left:50%;transform:translateX(-50%);
  font-family:'Fredoka',system-ui,sans-serif;font-size:11px;color:#78716c;opacity:.8;animation:cel-fade 1s ease both;animation-delay:.6s;}
@keyframes cel-fade{from{opacity:0}to{opacity:1}}
@keyframes cel-pop{0%{opacity:0;transform:translateX(-50%) scale(.6)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes bubble-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
`;

function buzz(pattern) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported (e.g. iOS Safari) — silently ignore */
  }
}

function Celebration({ milestone, onDone }) {
  const isMilestone = milestone != null;
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cheer = useMemo(
    () => (isMilestone ? milestoneMessage(milestone) : CHEERS[Math.floor(Math.random() * CHEERS.length)]),
    [isMilestone, milestone]
  );
  const pieces = useMemo(
    () =>
      Array.from({ length: reduce ? 0 : isMilestone ? 74 : 40 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * (isMilestone ? 0.6 : 0.35),
        dur: 1.6 + Math.random() * (isMilestone ? 1.8 : 1.3),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
      })),
    [reduce, isMilestone]
  );

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 1500 : isMilestone ? 4400 : 2800);
    return () => clearTimeout(t);
  }, [onDone, reduce, isMilestone]);

  return (
    <div className="celebrate-root" aria-hidden="true" onClick={onDone}>
      <div className="cel-backdrop" />
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
      <div className="cel-mascot">
        <div className="cel-bubble">{cheer}</div>
        <Mascot mood={isMilestone ? "milestone" : "cheer"} />
      </div>
      <div className="cel-skip">tap to dismiss</div>
    </div>
  );
}

export default function App() {
  const [days, setDays] = useState({});
  const [celebrated, setCelebrated] = useState([]); // milestone streak values already shown
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [celebrate, setCelebrate] = useState(null); // { id, milestone:number|null }
  const [selectedKey, setSelectedKey] = useState(() => fmt(new Date()));
  const fileRef = useRef(null);

  const todayKey = fmt(new Date());
  const selected = days[selectedKey] || {};
  const isEditingToday = selectedKey === todayKey;

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

  const persistAll = (nextDays, nextCelebrated) => {
    storage.set(STORAGE_KEY, JSON.stringify({ days: nextDays, celebrated: nextCelebrated }));
  };

  // streak ending yesterday + today only if secured
  const computeStreak = (d) => {
    let cur = 0;
    let cursor = addDays(new Date(), -1);
    while (dayHeld(d[fmt(cursor)]) >= HOLD_THRESHOLD) {
      cur++;
      cursor = addDays(cursor, -1);
    }
    if (dayHeld(d[todayKey]) >= HOLD_THRESHOLD) cur += 1;
    return cur;
  };

  const toggle = (key) => {
    const dayKey = selectedKey;
    const entry = { ...(days[dayKey] || {}) };
    const willBeOn = !entry[key];
    entry[key] = willBeOn;
    const next = { ...days, [dayKey]: entry };

    let nextCelebrated = celebrated;
    let fire = null;

    // Celebrations only fire when editing TODAY — backfilling a past day is a
    // quiet correction, not a fresh win.
    if (dayKey === todayKey) {
      if (key === "workout") {
        if (willBeOn) {
          fire = { id: Date.now(), milestone: null };
          buzz(35);
        }
      } else if (willBeOn) {
        const s = computeStreak(next);
        if (isMilestoneStreak(s) && !celebrated.includes(s)) {
          nextCelebrated = [...celebrated, s];
          fire = { id: Date.now(), milestone: s };
          buzz([0, 70, 50, 70, 50, 150]);
        }
      }
    }

    setDays(next);
    setCelebrated(nextCelebrated);
    persistAll(next, nextCelebrated);
    if (fire) setCelebrate(fire);
  };

  const saveWeight = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 30 || w > 200) return;
    const next = { ...days, [selectedKey]: { ...(days[selectedKey] || {}), weight: w } };
    setDays(next);
    persistAll(next, celebrated);
    setWeightInput("");
  };

  const downloadBackup = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `streak-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        importData(String(reader.result));
        const res = await storage.get(STORAGE_KEY);
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          setDays(parsed.days || {});
          setCelebrated(parsed.celebrated || []);
        }
      } catch {
        alert("That file couldn't be read as a backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const { current, best } = useMemo(() => {
    const cur = computeStreak(days);
    const keys = Object.keys(days).sort();
    let bst = cur;
    if (keys.length) {
      let run = 0;
      let d = new Date(keys[0]);
      const end = new Date(todayKey);
      while (d <= end) {
        const isToday = fmt(d) === todayKey;
        if (dayHeld(days[fmt(d)]) >= HOLD_THRESHOLD) {
          run++;
          if (run > bst) bst = run;
        } else if (!isToday) {
          run = 0;
        }
        d = addDays(d, 1);
      }
    }
    return { current: cur, best: bst };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, todayKey]);

  const weightStats = useMemo(() => {
    // all logged weights, chronological
    const series = Object.keys(days)
      .filter((k) => days[k] && typeof days[k].weight === "number")
      .sort()
      .map((k) => ({ key: k, value: days[k].weight }));

    const last7 = [];
    for (let i = 0; i < 7; i++) {
      const e = days[fmt(addDays(new Date(), -i))];
      if (e && typeof e.weight === "number") last7.push(e.weight);
    }
    const avg7 = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : null;
    const last = series.length ? series[series.length - 1] : null;

    return {
      last, // { key, value } | null
      avg7, // number | null
      avg7Count: last7.length,
      series: series.slice(-14), // last 14 weigh-ins for the trend line
    };
  }, [days]);

  const grid = useMemo(() => {
    const arr = [];
    for (let i = 34; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const k = fmt(d);
      arr.push({ k, score: dayHeld(days[k]), logged: !!days[k], isToday: k === todayKey, isSelected: k === selectedKey, workout: !!(days[k] && days[k].workout) });
    }
    return arr;
  }, [days, todayKey, selectedKey]);

  const cellClass = (c) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-stone-500">
        Loading your chain…
      </div>
    );
  }

  const selectedScore = dayHeld(selected);
  const selectedStatus = isEditingToday
    ? selectedScore >= 4
      ? "perfect"
      : selectedScore >= HOLD_THRESHOLD
      ? "secured"
      : "in progress"
    : selectedScore >= 4
    ? "perfect"
    : selectedScore >= HOLD_THRESHOLD
    ? "held"
    : "missed";
  const dayLabel = (key) =>
    key === todayKey
      ? "Today"
      : new Date(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900 px-4 py-6 sm:py-10">
      <style>{celebrationCss}</style>
      {celebrate && <Celebration key={celebrate.id} milestone={celebrate.milestone} onDone={() => setCelebrate(null)} />}

      <div className="max-w-md mx-auto">
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Don't break the chain</h1>
          <span className="text-xs font-mono text-stone-400">{todayKey}</span>
        </div>

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

        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-stone-800">{dayLabel(selectedKey)}</h2>
              {!isEditingToday && (
                <button
                  onClick={() => setSelectedKey(todayKey)}
                  className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full hover:bg-amber-200"
                >
                  ← Today
                </button>
              )}
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                selectedScore >= 4
                  ? "bg-emerald-100 text-emerald-700"
                  : selectedScore >= HOLD_THRESHOLD
                  ? "bg-amber-100 text-amber-700"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {selectedScore}/4 · {selectedStatus}
            </span>
          </div>

          <div className="space-y-2">
            {CORE.map(({ key, label, Icon }) => {
              const on = !!selected[key];
              return (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    on ? "bg-emerald-500 text-white" : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                  <span className="font-medium flex-1">{label}</span>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${on ? "bg-white/25" : "border-2 border-stone-300"}`}>
                    {on && <Check size={15} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => toggle("workout")}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition border-2 border-dashed ${
                selected.workout ? "bg-amber-400 border-amber-400 text-stone-900" : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Dumbbell size={20} strokeWidth={2.2} />
              <span className="font-medium flex-1">
                Workout <span className="text-xs opacity-70">(bonus)</span>
              </span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${selected.workout ? "bg-white/30" : "border-2 border-stone-300"}`}>
                {selected.workout && <Check size={15} strokeWidth={3} />}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-stone-800">Last 5 weeks</h2>
            <span className="text-[11px] text-stone-400">tap a day to edit</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((c) => (
              <button
                key={c.k}
                onClick={() => setSelectedKey(c.k)}
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

        <div className="rounded-3xl bg-white p-6 mb-5 shadow-sm border border-stone-100">
          <h2 className="font-bold text-stone-800 mb-4">Weight</h2>

          {weightStats.last ? (
            <>
              <div className="flex items-stretch gap-4 mb-5">
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">Last logged</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tabular-nums text-stone-900">{weightStats.last.value.toFixed(1)}</span>
                    <span className="text-base font-semibold text-stone-400">kg</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">{dayLabel(weightStats.last.key)}</div>
                </div>
                <div className="w-px bg-stone-100" />
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 mb-1">7-day average</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tabular-nums text-amber-600">
                      {weightStats.avg7 != null ? weightStats.avg7.toFixed(1) : "–"}
                    </span>
                    <span className="text-base font-semibold text-amber-400">kg</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {weightStats.avg7Count} weigh-in{weightStats.avg7Count === 1 ? "" : "s"} this week
                  </div>
                </div>
              </div>

              {weightStats.series.length >= 2 &&
                (() => {
                  const vals = weightStats.series.map((s) => s.value);
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
                        <span>{weightStats.series.length} recent weigh-ins</span>
                        <span className="tabular-nums">low {min.toFixed(1)} · high {max.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })()}
            </>
          ) : (
            <p className="text-sm text-stone-400 mb-4">No weigh-ins yet — log your first below.</p>
          )}

          <div className="flex gap-2 mt-4">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={selected.weight ? `${selected.weight} kg on ${dayLabel(selectedKey).toLowerCase()}` : `log ${dayLabel(selectedKey).toLowerCase()} (kg)`}
              className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={saveWeight} className="rounded-xl bg-stone-900 text-amber-50 px-5 py-3 text-sm font-semibold hover:bg-stone-800">
              Log
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-3">Judge by the average, never a single morning.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={downloadBackup} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
            <Download size={16} /> Backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
            <Upload size={16} /> Restore
          </button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onRestoreFile} className="hidden" />
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-5">
          Today counts once you hit {HOLD_THRESHOLD} of 4 — until then it never breaks your streak.
        </p>
      </div>
    </div>
  );
}