import { DayOfWeek } from "../models/types/openingHour.types";

export interface WorkingHour {
  open: string | null;
  close: string | null;
}

export type WorkingHours = Record<DayOfWeek, WorkingHour>;

const days: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Normalize a partial working hours object so that each day exists with open/close keys.
 * Missing days default to { open: null, close: null }.
 */
export function normalizeWorkingHours(
  working_hours: Partial<Record<DayOfWeek, Partial<WorkingHour>>>
): WorkingHours {
  const normalized: WorkingHours = {} as WorkingHours;

  for (const day of days) {
    const provided = working_hours[day] || {};
    normalized[day] = {
      open: provided.open ?? null,
      close: provided.close ?? null,
    };
  }

  return normalized;
}
