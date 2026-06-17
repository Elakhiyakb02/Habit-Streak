// Storage abstraction.
// Today it uses localStorage (per-device, free, no backend).
// The API is async on purpose: when you later want cloud sync (so your streak
// follows you across phones/browsers), you only swap the body of these four
// methods to call a backend (Firebase, Supabase, your own API) — the rest of
// the app never changes.

const PREFIX = "stk:";

export const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? null : { key, value: v };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch {
      return null;
    }
  },
  async remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

// --- Backup helpers (data safety) ---
// localStorage is wiped if you clear browser data, so let the user export a file.

export function exportData() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) out[k.slice(PREFIX.length)] = localStorage.getItem(k);
  }
  return JSON.stringify({ app: "streak-tracker", exportedAt: new Date().toISOString(), data: out }, null, 2);
}

export function importData(jsonString) {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data || parsed; // tolerate raw maps too
  Object.entries(data).forEach(([k, v]) => {
    localStorage.setItem(PREFIX + k, typeof v === "string" ? v : JSON.stringify(v));
  });
}
