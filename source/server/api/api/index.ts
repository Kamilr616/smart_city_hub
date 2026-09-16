import type {IncomingMessage, ServerResponse} from 'http';
import {connectToDatabase, createApp} from '../lib/server';

/**
 * Vercel serverless entry point. The Express application is built once per
 * cold start and reused by every invocation of the warm instance; the database
 * connection is shared through the cache in `lib/server.ts`.
 */
type RequestListener = (request: IncomingMessage, response: ServerResponse) => void;

const app = createApp() as unknown as RequestListener;

const MONGODB_URI_PATTERN = /mongodb(\+srv)?:\/\/\S+/gi;

const describeError = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    return message.replace(MONGODB_URI_PATTERN, '[redacted connection string]');
};

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
        await connectToDatabase();
    } catch (error) {
        console.error(`Database connection failed: ${describeError(error)}`);
        response.statusCode = 503;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({error: 'Database unavailable'}));
        return;
    }

    app(request, response);
}
