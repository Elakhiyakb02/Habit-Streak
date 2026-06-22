# Habit Streak — Learning Guide

A plain-English companion to the code we're building together. It assumes you can
read JavaScript but are newer to React. Concepts are explained the first time they
appear, using *our own code* as the example. Keep this file in the repo (e.g.
`docs/LEARNING.md`) — I'll keep adding to the **Dev journal** at the bottom as we go.

---

## 1. What we're building

A small habit tracker called **"Don't break the chain."** You tick off a few daily
habits; as long as you keep hitting them, a streak counter grows. Logging a workout
makes a mascot pop up and celebrate; hitting streak milestones (7, 30, 60, 90…) sets
off a bigger celebration. There's a 5-week calendar you can tap to edit any past day,
and a weight section with a 7-day average and a trend line.

It runs as a **PWA** (a website you can "install" to your phone home screen and use
offline), with no server — your data lives in the browser.

---

## 2. The tech stack (and what each piece is for)

- **React** — a library for building user interfaces out of reusable pieces called
  *components*. Instead of manually changing the page when data changes, you describe
  *what the screen should look like for a given set of data*, and React updates the
  page for you.
- **Vite** — the *build tool*. It runs a fast dev server while you code (`npm run dev`)
  and bundles everything into small files for production (`npm run build`).
- **Tailwind CSS** — styling via small utility classes in `className`, e.g.
  `className="text-2xl font-bold"` instead of writing separate CSS. Quick to read once
  you learn the vocabulary (`p-4` = padding, `rounded-2xl` = big rounded corners, etc.).
- **localStorage** — a tiny key-value store built into every browser. We save your
  habits there so they survive refreshes. (Limitation: it's per-device.)
- **PWA bits** — a `manifest.webmanifest` (name, icons, colors) + a `service worker`
  (`sw.js`) that caches files so the app loads offline and feels app-like.
- **GitHub + Netlify** — GitHub stores the code; Netlify watches it and rebuilds +
  redeploys the live site every time you `git push`.

How they fit together:

```
You write code  →  Vite bundles it  →  git push to GitHub  →  Netlify builds & hosts
                                                                      ↓
                                              your phone loads it, installs as a PWA,
                                              saves data in localStorage
```

---

## 3. Project structure (file by file)

```
streak-tracker/
├── index.html                 ← the single HTML page; loads fonts + the app
├── package.json               ← lists dependencies and scripts (dev/build)
├── vite.config.js             ← Vite settings (React plugin, base path)
├── tailwind.config.js         ← tells Tailwind which files to scan for classes
├── postcss.config.js          ← plumbing Tailwind needs
├── public/                    ← files copied as-is to the site root
│   ├── manifest.webmanifest   ← PWA metadata (name, icons)
│   ├── sw.js                  ← service worker (offline caching)
│   ├── icon-192.png / 512     ← app icons
│   ├── mascot.png             ← your avatar (thumbs-up) for workout cheers
│   └── mascot-milestone.png   ← your avatar (surprised) for milestones
└── src/
    ├── main.jsx               ← entry point: mounts React, registers the SW
    ├── index.css              ← Tailwind imports + a few base styles
    ├── App.jsx                ← the whole app UI + logic (the big one)
    ├── components/
    │   └── Mascot.jsx         ← the animated mascot component
    └── lib/
        └── storage.js         ← saving/loading data (localStorage wrapper)
```

A useful mental model: **`main.jsx` starts everything, `App.jsx` is the app, and the
files in `components/` and `lib/` are helpers `App.jsx` uses.**

---

## 4. React fundamentals, using our code

### 4.1 Components & JSX
A **component** is a JavaScript function that returns *JSX* — HTML-like markup that
describes UI. Our whole app is the `App` component; the mascot is the `Mascot`
component. Components can use other components like HTML tags.

```jsx
export default function Mascot({ mood = "cheer" }) {
  return <div className="mascot-stage">...</div>;  // JSX
}
```

JSX rules that trip people up early:
- Use `className` instead of `class`.
- Every expression in `{ }` is real JavaScript: `{score}/4`.
- A component must return *one* top-level element (wrap siblings in a `<div>` or `<>…</>`).

### 4.2 Props (passing data into a component)
**Props** are inputs to a component, like function arguments. We tell the mascot which
mood to show:

```jsx
<Mascot mood="milestone" />     // in App.jsx we pass a prop
```
```jsx
function Mascot({ mood }) { ... }   // Mascot receives it
```

### 4.3 State (data that can change) — `useState`
**State** is data a component remembers between renders, and changing it makes React
re-draw the screen. You create it with the `useState` *hook*:

```jsx
const [days, setDays] = useState({});   // days = current value, setDays = how you change it
```

When you call `setDays(newValue)`, React re-runs the `App` function and updates the
page to match the new `days`. **You never edit `days` directly** — always call
`setDays`. Our app's main state:

- `days` — all your logged data (explained in §5).
- `celebrated` — which milestones already threw a party (so they don't repeat).
- `selectedKey` — which day the checklist is currently editing.
- `celebrate` — info about an active celebration (or `null` when none).
- `weightInput`, `loading` — small UI bits.

### 4.4 Rendering lists with `.map()` and `key`
To turn an array into UI, you `.map()` it to JSX. React needs a unique `key` on each
item so it can track them efficiently:

```jsx
{CORE.map(({ key, label, Icon }) => (
  <button key={key} onClick={() => toggle(key)}>{label}</button>
))}
```
We do the same for the 35 calendar cells (`grid.map(...)`).

### 4.5 Conditional rendering
Show something only when a condition holds, using `&&` or a ternary `? :`:

```jsx
{celebrate && <Celebration ... />}            // render only if celebrate is set
{on ? "done" : "not done"}                    // choose between two
```

### 4.6 Event handlers
Functions that run on interaction, e.g. `onClick`:

```jsx
<button onClick={() => toggle("walk")}>Walked</button>
```
Note `onClick={() => toggle("walk")}` (a function) — not `onClick={toggle("walk")}`,
which would *call it immediately* during render.

### 4.7 `useEffect` — running code at the right time
`useEffect` runs *after* render, for things that aren't pure rendering — like loading
saved data once when the app starts. The empty `[]` means "run once on mount":

```jsx
useEffect(() => {
  // load saved data from storage
}, []);
```

### 4.8 `useMemo` — caching expensive calculations
`useMemo` remembers the result of a calculation and only recomputes it when its inputs
change. We use it for derived values like the streak so they don't recompute on every
keystroke:

```jsx
const { current, best } = useMemo(() => { ...compute streak... }, [days, todayKey]);
```
"Derived" = calculated *from* state rather than stored separately. The streak isn't
saved anywhere; it's always computed from `days`.

### 4.9 `useRef` — a handle to something that isn't state
We use a ref to "click" a hidden file input when the user taps **Restore**:

```jsx
const fileRef = useRef(null);
<input ref={fileRef} type="file" className="hidden" />
<button onClick={() => fileRef.current?.click()}>Restore</button>
```

---

## 5. How the data is shaped

Everything you log lives in one object, `days`, keyed by date string:

```js
days = {
  "2026-06-20": { protein: true, walk: true, sleep: true, workout: true, weight: 73.2 },
  "2026-06-21": { protein: true, plan: true },
  // ...
}
```

- The date format `"YYYY-MM-DD"` is produced by our `fmt(date)` helper. Sorting these
  strings alphabetically also sorts them by date — handy.
- A day only stores the habits you actually ticked; missing ones are just absent.
- We also keep `celebrated: [7, 30]` (milestones already shown).

Saving/loading goes through **`src/lib/storage.js`**, which wraps `localStorage`:

```js
storage.get(key)   // read
storage.set(key, value)   // write
```

Why a wrapper instead of calling `localStorage` directly? So that *later*, when you
want your streak to sync across phones, you only change those few functions to talk to
a real database — the rest of the app doesn't know or care where data lives. This is a
common, valuable pattern: **isolate the thing likely to change behind a small interface.**

The save pattern we repeat: build the *next* version of the data, set state, persist:

```js
const next = { ...days, [dayKey]: entry };  // copy + change one day
setDays(next);                               // update UI
persistAll(next, celebrated);                // write to storage
```
The `{ ...days }` spread makes a *new* object instead of mutating the old one — React
detects change by comparing references, so creating new objects is important.

---

## 6. Feature deep-dives (the interesting logic)

### 6.1 The streak calculation
A day "holds the chain" if you hit at least `HOLD_THRESHOLD` (3) of the 4 core habits —
that's the built-in 80% rule so one slip doesn't reset you.

`computeStreak` counts consecutive held days **ending yesterday**, then adds 1 only if
*today* is already secured. This is the fix for an early bug: today is "in progress"
and must never count as a broken link while you're still ticking it off.

```js
let cur = 0;
let cursor = addDays(new Date(), -1);          // start at yesterday
while (dayHeld(d[fmt(cursor)]) >= HOLD_THRESHOLD) {
  cur++;
  cursor = addDays(cursor, -1);                // walk backwards
}
if (dayHeld(d[todayKey]) >= HOLD_THRESHOLD) cur += 1;  // today only adds, never breaks
```

### 6.2 The calendar grid
We build an array of the last 35 days, each with its score and flags, then `.map()` it
into a 7-column grid (`grid grid-cols-7`). `cellClass()` picks a color from the score
(green = 4/4, amber = 3/4, red = missed, etc.) and adds a ring for today / the selected day.

### 6.3 Editing past days
`selectedKey` decides which day the checklist edits (defaults to today). Tapping a
calendar cell does `setSelectedKey(thatDay)`. The checklist, status badge, and weight
input all read from `selected = days[selectedKey]`. Celebrations are gated to only fire
when `selectedKey === todayKey`, because backfilling old days is a correction, not a
fresh win.

### 6.4 Celebrations (the overlay)
The celebration is **state-driven**: `setCelebrate({ id, milestone })` makes the
`<Celebration>` overlay appear; a `setTimeout` inside it calls `onDone` to clear the
state and remove it. Two React details worth noting:

- We pass `key={celebrate.id}` so that triggering a new celebration *remounts* the
  component fresh (restarting the animation), even back-to-back.
- The confetti is just an array of randomized little `<span>`s animated with CSS.

### 6.5 The mascot
`Mascot` is a separate component that swaps the image and animation based on `mood`:
`cheer` → thumbs-up avatar with a gentle wiggle; `milestone` → surprised avatar with a
bigger pulse. The animations are pure CSS keyframes inside the component — no library.
The avatar PNGs had their backgrounds removed so they float over the app.

### 6.6 Haptics (the buzz)
On a workout we trigger a short vibration; on a milestone, a stronger pattern:

```js
navigator.vibrate(35);                      // workout
navigator.vibrate([0, 70, 50, 70, 50, 150]); // milestone (buzz-pause-buzz...)
```
This works on Android browsers; iOS Safari ignores it, so we guard it and let it do
nothing there rather than crash.

### 6.7 Milestones
`isMilestoneStreak(n)` returns true for 7, then every 30 (`n % 30 === 0`). When a habit
toggle pushes today's streak onto one of those numbers *and* we haven't celebrated it
before, we fire the big celebration and record the number in `celebrated` so it won't
repeat if you reopen the app.

### 6.8 Weight section + the SVG sparkline
`weightStats` (a `useMemo`) derives three things from `days`: the most recent weigh-in,
the 7-day average, and the last 14 weigh-ins for a trend line. The trend line is a tiny
hand-built SVG: we map each weight to an (x, y) point — x spreads evenly across the
width, y is scaled between the min and max — and draw a `<polyline>` through them. We
emphasize the *average* (big, colored) over the last reading, because a single morning
swings a kilo or two on water alone.

---

## 7. The day-to-day workflow

```bash
npm install      # once (and after dependency changes) — downloads libraries
npm run dev      # local dev server with hot reload while you code
npm run build    # produce the optimized /dist for deploy
```

To ship a change:
```bash
git add <files>
git commit -m "what changed"
git push          # Netlify auto-builds and redeploys
```

Two gotchas we hit (documented so they're not mysterious later):
- **Corporate npm registry:** your machine defaulted to Zoho's internal registry, which
  doesn't have some public packages. We added a project-only `.npmrc` with
  `registry=https://registry.npmjs.org/` so *this* repo installs from the public
  registry without changing your global setup.
- **GitHub login:** GitHub no longer accepts your account password for `git push`; you
  use a Personal Access Token (or SSH key) instead.

---

## 8. Dev journal (newest at the bottom)

A running log of what we built, in order. Each entry = roughly one change we shipped.

1. **Project bootstrap.** Turned the prototype into a real Vite + React + Tailwind
   project; moved data storage to `localStorage` behind `storage.js`; made it a PWA.
2. **Removed the PWA plugin.** The build host couldn't fetch `vite-plugin-pwa` from the
   corporate registry, so we replaced it with a hand-written `manifest.webmanifest` and
   a small network-first `sw.js`. Fewer dependencies, same result.
3. **Streak bug fix.** Today was wrongly counted as a "miss" while still in progress.
   Rewrote `computeStreak` to count up to yesterday and only add today once it's secured.
4. **Workout celebration v1.** Added confetti + a bouncing emoji mascot + cheer bubble
   when a workout is logged.
5. **Real mascot.** Replaced the emoji (and a hand-drawn SVG attempt) with your own
   avatar image; removed its background programmatically so it floats cleanly.
6. **Polish pass.** Dimmed/locked backdrop with tap-to-skip during celebrations; switched
   the cheer font to Fredoka; added the 💪🏼 emoji to workout days in the calendar.
7. **Wiggle, not jump.** Changed the workout mascot animation from a jump to a gentle wiggle.
8. **Milestone mascot.** Added a second avatar (surprised, hands-up) used only for streak
   milestones, with a bigger "pulse" animation distinct from the workout wiggle.
9. **Edit past days.** Made the calendar tappable so any day loads into the checklist for
   editing; the streak recalculates, so fixing a missed log can repair the chain.
10. **Weight section revamp.** Gave weight its own prominent card: last logged + 7-day
    average as headline numbers, plus an SVG trend line of recent weigh-ins.
11. **This learning guide.** Started documenting the project for learning, to be updated
    as we keep building.

---

## 9. Mini glossary

- **Component** — a function that returns UI (JSX).
- **JSX** — HTML-like syntax inside JavaScript.
- **Prop** — an input passed into a component.
- **State** — data a component remembers; changing it re-renders the UI.
- **Hook** — a special React function starting with `use` (`useState`, `useEffect`,
  `useMemo`, `useRef`) that adds a capability to a component.
- **Render** — React running your component to produce the current UI.
- **Mount / unmount** — when a component first appears / is removed.
- **Derived data** — values calculated from state rather than stored (e.g. the streak).
- **Spread (`...`)** — copies an object/array so you create a new one instead of mutating.
- **PWA** — a website installable to the home screen, works offline.
- **Service worker** — background script that caches the app for offline use.
- **localStorage** — browser key-value storage that persists across refreshes.

---

*Maintained alongside the code — when we add a feature, it gets a journal entry and, if
it introduces a new concept, a short explanation above.*