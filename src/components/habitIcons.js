import { Check, Moon, Footprints, Utensils } from "lucide-react";

// Maps a habit key to its icon. Kept out of lib/ so the logic files stay UI-free.
export const HABIT_ICONS = {
  protein: Utensils,
  plan: Check,
  walk: Footprints,
  sleep: Moon,
};
