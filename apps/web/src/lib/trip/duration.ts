const DAY_MS = 86_400_000;

export function daysBetween(start: string, end: string): number | null {
  const startMs = dateOnlyToMs(start);
  const endMs = dateOnlyToMs(end);
  if (startMs == null || endMs == null || endMs < startMs) {
    return null;
  }
  return Math.round((endMs - startMs) / DAY_MS) + 1;
}

function dateOnlyToMs(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
}
