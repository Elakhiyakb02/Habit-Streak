// Pure date helpers — no React here, just functions.

// Turn a Date into a "YYYY-MM-DD" string (local time).
// Sorting these strings alphabetically also sorts them by date.
export const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Return a new Date n days away from d (n can be negative).
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const todayKey = () => fmt(new Date());

// Human label for a day key: "Today" or e.g. "Sun, 15 Jun".
export const dayLabel = (key) =>
  key === todayKey()
    ? "Today"
    : new Date(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
