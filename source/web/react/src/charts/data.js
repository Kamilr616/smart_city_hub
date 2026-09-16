const ranges = {
  '1h': 3600000,
  '24h': 86400000,
  '7d': 604800000,
  '30d': 2592000000,
};
export const RANGE_OPTIONS = [
  ['1h', 'Last hour'],
  ['24h', 'Last 24 hours'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
];
export const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#d97706' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#0284c7' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#7c3aed' },
];

export function historyRange(range, now = Date.now()) {
  if (!ranges[range]) throw new RangeError('Unknown time range.');
  return {
    from: new Date(now - ranges[range]).toISOString(),
    to: new Date(now).toISOString(),
  };
}

export function buildSensorSeries(readings = []) {
  const sorted = readings
    .filter((reading) => Number.isFinite(Date.parse(reading.readingDate)))
    .slice()
    .sort((a, b) => Date.parse(a.readingDate) - Date.parse(b.readingDate));
  return Object.fromEntries(
    METRICS.map(({ key }) => [
      key,
      sorted.map((reading) => ({
        x: Date.parse(reading.readingDate),
        y:
          typeof reading[key] === 'number' && Number.isFinite(reading[key])
            ? reading[key]
            : null,
      })),
    ]),
  );
}

export function buildStateSeries({
  from,
  to,
  initialState,
  states = [],
  truncated = false,
}) {
  const start = Date.parse(from);
  const end = Date.parse(to);
  const points = states
    .filter(
      (item) =>
        typeof item.state === 'boolean' &&
        Number.isFinite(Date.parse(item.timestamp)),
    )
    .map((item) => ({ x: Date.parse(item.timestamp), y: Number(item.state) }))
    .filter((item) => item.x >= start && item.x <= end)
    .sort((a, b) => a.x - b.x);
  if (!truncated && typeof initialState === 'boolean')
    points.unshift({ x: start, y: Number(initialState) });
  if (points.length && points.at(-1).x < end)
    points.push({ x: end, y: points.at(-1).y });
  return points;
}

export function isStaleReading(reading, now = Date.now()) {
  const timestamp = Date.parse(reading?.readingDate);
  return Number.isFinite(timestamp) && now - timestamp > 15 * 60 * 1000;
}

export function formatTimestamp(value) {
  if (value == null || value === '') return 'No reading';
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime())
    ? timestamp.toLocaleString('en-GB')
    : 'No reading';
}

export function formatMetric(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
    : '—';
}

// These values stay in browser memory and are never sent to the API.
export function createDemoHistory(range, deviceId, now = Date.now()) {
  const { from, to } = historyRange(range, now);
  const start = Date.parse(from);
  const end = Date.parse(to);
  const readings = Array.from({ length: 49 }, (_, index) => ({
    deviceId,
    readingDate: new Date(start + ((end - start) * index) / 48).toISOString(),
    temperature: Number((21 + 3 * Math.sin(index / 7)).toFixed(2)),
    humidity: Number((52 + 12 * Math.cos(index / 9)).toFixed(2)),
    pressure: Number((1013 + 5 * Math.sin(index / 12)).toFixed(2)),
  }));
  return { source: 'demo', deviceId, from, to, readings, truncated: false };
}
