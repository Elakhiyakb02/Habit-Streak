import { fmt, addDays } from "./dates.js";

// Derive weight stats from the days object:
//   last       → most recent weigh-in { key, value } | null
//   avg7       → average of weights logged in the last 7 calendar days | null
//   avg7Count  → how many of those 7 days had a weigh-in
//   series     → last 14 weigh-ins (chronological) for the trend line
export function computeWeightStats(days) {
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

  return { last, avg7, avg7Count: last7.length, series: series.slice(-14) };
}
