export interface HistoryRange {
    from: Date;
    to: Date;
    limit: number;
}

const DAY = 24 * 60 * 60 * 1000;

function isoDate(value: unknown): Date {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
        throw new Error('Expected an ISO timestamp with timezone.');
    }
    const date = new Date(value);
    // Date.parse normalizes impossible calendar dates such as February 30.
    const calendar = new Date(value.slice(0, 10) + 'T00:00:00Z');
    if (!Number.isFinite(date.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) {
        throw new Error('Invalid timestamp.');
    }
    return date;
}

export function parseHistoryRequest(id: string, query: Record<string, unknown>, deviceCount: number) {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) >= deviceCount) {
        throw new Error('Invalid device ID.');
    }
    const to = query.to === undefined ? new Date() : isoDate(query.to);
    const from = query.from === undefined ? new Date(to.getTime() - DAY) : isoDate(query.from);
    const duration = to.getTime() - from.getTime();
    if (duration <= 0 || duration > 31 * DAY) {
        throw new Error('History range must be positive and at most 31 days.');
    }
    if (query.limit !== undefined && (typeof query.limit !== 'string' || !/^\d+$/.test(query.limit))) {
        throw new Error('Invalid limit.');
    }
    const limit = query.limit === undefined ? 1000 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 2000) {
        throw new Error('Limit must be between 1 and 2000.');
    }
    return {deviceId: Number(id), from, to, limit};
}
