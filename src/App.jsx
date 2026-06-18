import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame, Check, Moon, Footprints, Utensils, Dumbbell, Trophy, Download, Upload } from "lucide-react";
import { storage, exportData, importData } from "./lib/storage.js";

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

// ---- workout celebration ----
const MASCOTS = ["🌻", "🐰", "🐱", "🦊", "🐧", "🦋", "🐥", "🦄", "🐢", "🐼"];
const CHEERS = ["Workout done! 💪", "Crushed it! 🔥", "Look at you go! ✨", "Beast mode 💪", "Proud of you! 🌟"];
const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#fde047"];

const celebrationCss = `
.celebrate-root{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden;}
.confetti{position:absolute;top:-14px;border-radius:2px;opacity:0;
  animation-name:confetti-fall;animation-timing-function:cubic-bezier(.25,.7,.4,1);animation-fill-mode:forwards;}
@keyframes confetti-fall{0%{opacity:1;transform:translateY(-10px) rotate(0deg)}100%{opacity:0;transform:translateY(106vh) rotate(720deg)}}
.mascot{position:absolute;left:50%;bottom:20%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:10px;animation:mascot-pop .35s ease-out both;}
.dancer{font-size:78px;line-height:1;transform-origin:50% 90%;animation:dance .6s ease-in-out infinite;
  filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));}
.bubble{background:#1c1917;color:#fef3c7;font-size:13px;font-weight:700;padding:7px 14px;border-radius:9999px;
  box-shadow:0 6px 18px rgba(0,0,0,.2);animation:bubble-bob 1.1s ease-in-out infinite;white-space:nowrap;}
@keyframes mascot-pop{0%{opacity:0;transform:translateX(-50%) scale(.3)}70%{transform:translateX(-50%) scale(1.12)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes dance{0%,100%{transform:rotate(-13deg) translateY(0)}25%{transform:rotate(9deg) translateY(-9px)}50%{transform:rotate(-9deg) translateY(0)}75%{transform:rotate(13deg) translateY(-7px)}}
@keyframes bubble-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@media (prefers-reduced-motion: reduce){.dancer{animation:none}.bubble{animation:none}.confetti{display:none}}
`;

function Celebration({ onDone }) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mascot = useMemo(() => MASCOTS[Math.floor(Math.random() * MASCOTS.length)], []);
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], []);
  const pieces = useMemo(
    () =>
      Array.from({ length: reduce ? 0 : 38 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        dur: 1.6 + Math.random() * 1.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
      })),
    [reduce]
  );

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 1400 : 2600);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <div className="celebrate-root" aria-hidden="true">
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
      <div className="mascot">
        <div className="bubble">{cheer}</div>
        <div className="dancer">{mascot}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [celebrate, setCelebrate] = useState(null);
  const fileRef = useRef(null);

  const todayKey = fmt(new Date());
  const today = days[todayKey] || {};

  useEffect(() => {
    (async () => {
      const res = await storage.get(STORAGE_KEY);
      if (res && res.value) {
        try {
          setDays(JSON.parse(res.value).days || {});
        } catch {
          /* corrupt — start fresh */
        }
      }
      setLoading(false);
    })();
  }, []);

  const persist = (next) => {
    setDays(next);
    storage.set(STORAGE_KEY, JSON.stringify({ days: next }));
  };

  const toggle = (key) => {
    const entry = { ...(days[todayKey] || {}) };
    const willBeOn = !entry[key];
    entry[key] = willBeOn;
    persist({ ...days, [todayKey]: entry });
    // celebrate only when turning the workout ON
    if (key === "workout" && willBeOn) setCelebrate(Date.now());
  };

  const saveWeight = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 30 || w > 200) return;
    persist({ ...days, [todayKey]: { ...(days[todayKey] || {}), weight: w } });
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
        if (res?.value) setDays(JSON.parse(res.value).days || {});
      } catch {
        alert("That file couldn't be read as a backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const { current, best } = useMemo(() => {
    let cur = 0;
    let cursor = addDays(new Date(), -1);
    while (dayHeld(days[fmt(cursor)]) >= HOLD_THRESHOLD) {
      cur++;
      cursor = addDays(cursor, -1);
    }
    if (dayHeld(days[todayKey]) >= HOLD_THRESHOLD) cur += 1;

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
  }, [days, todayKey]);

  const weightTrend = useMemo(() => {
    const last7 = [];
    for (let i = 0; i < 7; i++) {
      const e = days[fmt(addDays(new Date(), -i))];
      if (e && e.weight) last7.push(e.weight);
    }
    if (!last7.length) return null;
    return { avg: (last7.reduce((a, b) => a + b, 0) / last7.length).toFixed(1), n: last7.length };
  }, [days]);

  const grid = useMemo(() => {
    const arr = [];
    for (let i = 34; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const k = fmt(d);
      arr.push({ k, score: dayHeld(days[k]), logged: !!days[k], isToday: k === todayKey });
    }
    return arr;
  }, [days, todayKey]);

  const cellClass = (c) => {
    if (c.isToday) {
      const ring = " ring-2 ring-amber-400";
      if (c.score >= 4) return "bg-emerald-500" + ring;
      if (c.score >= HOLD_THRESHOLD) return "bg-amber-400" + ring;
      return "bg-amber-200" + ring;
    }
    if (!c.logged) return "bg-stone-200/60";
    if (c.score >= 4) return "bg-emerald-500";
    if (c.score >= HOLD_THRESHOLD) return "bg-amber-400";
    return "bg-rose-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-stone-500">
        Loading your chain…
      </div>
    );
  }

  const todayScore = dayHeld(today);
  const todayStatus =
    todayScore >= 4 ? "perfect" : todayScore >= HOLD_THRESHOLD ? "secured" : "in progress";

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900 px-4 py-6 sm:py-10">
      <style>{celebrationCss}</style>
      {celebrate && <Celebration key={celebrate} onDone={() => setCelebrate(null)} />}

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
            <h2 className="font-bold text-stone-800">Today</h2>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                todayScore >= 4
                  ? "bg-emerald-100 text-emerald-700"
                  : todayScore >= HOLD_THRESHOLD
                  ? "bg-amber-100 text-amber-700"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {todayScore}/4 · {todayStatus}
            </span>
          </div>

          <div className="space-y-2">
            {CORE.map(({ key, label, Icon }) => {
              const on = !!today[key];
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
                today.workout ? "bg-amber-400 border-amber-400 text-stone-900" : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Dumbbell size={20} strokeWidth={2.2} />
              <span className="font-medium flex-1">
                Workout <span className="text-xs opacity-70">(bonus)</span>
              </span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${today.workout ? "bg-white/30" : "border-2 border-stone-300"}`}>
                {today.workout && <Check size={15} strokeWidth={3} />}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
          <h2 className="font-bold text-stone-800 mb-3">Last 5 weeks</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((c) => (
              <div key={c.k} title={`${c.k} · ${c.logged ? c.score + "/4" : "not logged"}`} className={`aspect-square rounded-md ${cellClass(c)}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-stone-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> 4/4</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> 3/4</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200" /> today</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-300" /> missed</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 mb-5 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-stone-800">Weight check</h2>
            {weightTrend && (
              <span className="text-sm text-stone-500">
                7-day avg <span className="font-bold text-stone-800 tabular-nums">{weightTrend.avg} kg</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mb-3">Optional. Judge by the average, never a single morning.</p>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={today.weight ? `${today.weight} kg logged` : "kg today"}
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={saveWeight} className="rounded-xl bg-stone-900 text-amber-50 px-4 py-2 text-sm font-semibold hover:bg-stone-800">
              Log
            </button>
          </div>
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