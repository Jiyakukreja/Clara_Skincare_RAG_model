/** Stable message ids even when crypto.randomUUID is unavailable. */
export function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
