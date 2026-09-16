import type {IncomingMessage, ServerResponse} from 'http';
import {config} from '../lib/config';
import {connectToDatabase, createApp, describeError} from '../lib/server';

/**
 * Vercel serverless entry point. The Express application is built once per
 * cold start and reused by every invocation of the warm instance; the database
 * connection is shared through the cache in `lib/server.ts`.
 */
type RequestListener = (request: IncomingMessage, response: ServerResponse) => void;

const app = createApp() as unknown as RequestListener;

/**
 * The CORS middleware inside the Express app never runs when the database is
 * unreachable, so the 503 below has to carry the headers itself; otherwise the
 * browser reports an opaque CORS failure instead of the real outage.
 */
const applyCorsHeaders = (request: IncomingMessage, response: ServerResponse): void => {
    response.setHeader('Vary', 'Origin');
    const origin = request.headers.origin;
    if (typeof origin === 'string' && config.corsOrigins.indexOf(origin) !== -1) {
        response.setHeader('Access-Control-Allow-Origin', origin);
    }
};

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    // A preflight is answered by the CORS middleware and never touches the
    // database, so it must not be blocked by a connection attempt.
    if (request.method === 'OPTIONS') {
        app(request, response);
        return;
    }

    try {
        await connectToDatabase();
    } catch (error) {
        console.error(`Database connection failed: ${describeError(error)}`);
        applyCorsHeaders(request, response);
        response.statusCode = 503;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({error: 'Database unavailable'}));
        return;
    }

    app(request, response);
}
