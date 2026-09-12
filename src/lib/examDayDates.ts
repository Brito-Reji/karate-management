export const EXAM_DAY_TIMEZONE = "Asia/Kolkata";

/** YYYY-MM-DD in Asia/Kolkata */
export function getTodayDateString(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EXAM_DAY_TIMEZONE }).format(
    new Date()
  );
}

export function parseExamDayRange(dateStr: string): { start: Date; end: Date } | null {
  const trimmed = dateStr.trim();
  if (!/^(\d{4})-(\d{2})-(\d{2})$/.test(trimmed)) return null;

  const start = new Date(`${trimmed}T00:00:00+05:30`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function shiftDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatExamDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatExamDayChip(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
