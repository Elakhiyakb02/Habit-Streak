import React, { useState } from "react";
import { useTracker } from "./hooks/useTracker.js";
import { buzz } from "./lib/haptics.js";
import StreakHero from "./components/StreakHero.jsx";
import DayChecklist from "./components/DayChecklist.jsx";
import CalendarGrid from "./components/CalendarGrid.jsx";
import WeightSection from "./components/WeightSection.jsx";
import BackupBar from "./components/BackupBar.jsx";
import Celebration from "./components/Celebration.jsx";

// App is now a thin "composer": it pulls data from the useTracker hook, owns the
// small bits of UI navigation state (which day is selected, any active celebration),
// and arranges the section components. All the heavy logic lives in lib/ and the hook.
export default function App() {
  const { days, loading, todayKey, streak, weightStats, toggleHabit, setWeight, backup, restoreFromText } = useTracker();

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [celebrate, setCelebrate] = useState(null); // { id, milestone:number|null }

  const selectedEntry = days[selectedKey] || {};
  const isEditingToday = selectedKey === todayKey;

  const handleToggle = (habitKey) => {
    const event = toggleHabit(selectedKey, habitKey);
    if (!event) return;
    if (event.type === "workout") {
      buzz(35);
      setCelebrate({ id: Date.now(), milestone: null });
    } else if (event.type === "milestone") {
      buzz([0, 70, 50, 70, 50, 150]);
      setCelebrate({ id: Date.now(), milestone: event.value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 text-stone-500">
        Loading your chain…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900 px-4 py-6 sm:py-10">
      {celebrate && (
        <Celebration key={celebrate.id} milestone={celebrate.milestone} onDone={() => setCelebrate(null)} />
      )}

      <div className="max-w-md mx-auto">
        <div className="flex items-baseline justify-between mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Don't break the chain</h1>
          <span className="text-xs font-mono text-stone-400">{todayKey}</span>
        </div>

        <StreakHero current={streak.current} best={streak.best} />

        <DayChecklist
          dayKey={selectedKey}
          entry={selectedEntry}
          isToday={isEditingToday}
          onToggle={handleToggle}
          onBackToToday={() => setSelectedKey(todayKey)}
        />

        <CalendarGrid days={days} todayKey={todayKey} selectedKey={selectedKey} onSelect={setSelectedKey} />

        <WeightSection
          stats={weightStats}
          selectedEntry={selectedEntry}
          selectedKey={selectedKey}
          onLog={(raw) => setWeight(selectedKey, raw)}
        />

        <BackupBar todayKey={todayKey} getBackupText={backup} onRestoreText={restoreFromText} />

        <p className="text-center text-[11px] text-stone-400 mt-5">
          Today counts once you hit 3 of 4 — until then it never breaks your streak.
        </p>
      </div>
    </div>
  );
}
