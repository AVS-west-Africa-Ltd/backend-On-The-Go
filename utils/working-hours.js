const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

exports.normalizeWorkingHours = function (working_hours) {
  const defaultDay = { open: null, close: null };
  const normalized = {};

  for (const day of days) {
    const provided = working_hours[day] || {};
    normalized[day] = {
      open: provided.open ?? null,
      close: provided.close ?? null,
    };
  }

  return normalized;
};
