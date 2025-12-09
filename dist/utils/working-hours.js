"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWorkingHours = normalizeWorkingHours;
const days = [
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
function normalizeWorkingHours(working_hours) {
    const normalized = {};
    for (const day of days) {
        const provided = working_hours[day] || {};
        normalized[day] = {
            open: provided.open ?? null,
            close: provided.close ?? null,
        };
    }
    return normalized;
}
