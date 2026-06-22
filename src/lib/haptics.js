// Trigger a vibration if the device supports it (Android browsers do; iOS Safari
// ignores it). Wrapped so an unsupported device never throws.
export function buzz(pattern) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* unsupported — ignore */
  }
}
