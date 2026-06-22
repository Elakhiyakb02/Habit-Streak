// The core habits the streak is built on. To add a habit, add it here and
// (for an icon) add a matching entry in src/components/habitIcons.js.
export const CORE = [
  { key: "protein", label: "Protein every meal" },
  { key: "plan", label: "Stayed within plan" },
  { key: "walk", label: "Walked / moved" },
  { key: "sleep", label: "Lights out by 11" },
];

// A day "holds the chain" if at least this many core habits are done (80% rule).
export const HOLD_THRESHOLD = 3;

// How many core habits were completed for a given day's entry.
export const dayHeld = (entry) => (entry ? CORE.filter((c) => entry[c.key]).length : 0);
