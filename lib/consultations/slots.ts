export const DEFAULT_DURATION_MINS = 60;

export const SLOT_TIMES: readonly string[] = Array.from(
  { length: 11 },
  (_, i) => `${String(8 + i).padStart(2, "0")}:00`,
);
