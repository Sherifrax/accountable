import { differenceInCalendarDays, format, parseISO } from "date-fns";

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** `$12,500`. Amounts are rounded to whole dollars. */
export function money(value: number): string {
  return dollars.format(Math.round(value));
}

/** `$1.2M`, `$48K`, `$950`. For big figures in tiles; the full amount goes in a tooltip. */
export function shortMoney(value: number): string {
  const rounded = Math.round(value);
  const abs = Math.abs(rounded);
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1_000_000) return `$${trim(rounded / 1_000_000)}M`;
  if (abs >= 10_000) return `$${Math.round(rounded / 1000)}K`;
  if (abs >= 1_000) return `$${trim(rounded / 1000)}K`;
  return dollars.format(rounded);
}

/** `Mar 4, 2026` from `2026-03-04` (a plain date, in local time). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return format(parseISO(value), "MMM d, yyyy");
}

/** `Mar 4, 2026, 2:15 PM` from `2026-03-04T14:15:00`. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return format(parseISO(value), "MMM d, yyyy, h:mm a");
}

/** `Mar 4` for tight spaces such as chart axes and cards. */
export function formatShortDate(value: string): string {
  return format(parseISO(value), "MMM d");
}

/** The value for a `datetime-local` input. */
export function toInputDateTime(value: Date | string): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function todayIso(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

/** Relative wording for follow-ups: "Today", "in 3 days", "5 days overdue". */
export function followUpWording(date: string, now: Date = new Date()): string {
  const days = differenceInCalendarDays(parseISO(date), now);
  if (days === 0) return "Today";
  const n = Math.abs(days);
  const unit = n === 1 ? "day" : "days";
  return days > 0 ? `in ${n} ${unit}` : `${n} ${unit} overdue`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** `+18%` or `-5%`. */
export function signedPercent(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}%`;
}

/** `Mar 2026` style month label from `2026-03`. */
export function monthLabel(key: string, style: "short" | "long" = "short"): string {
  const d = parseISO(`${key}-01`);
  return style === "short" ? format(d, "MMM") : format(d, "MMMM yyyy");
}
