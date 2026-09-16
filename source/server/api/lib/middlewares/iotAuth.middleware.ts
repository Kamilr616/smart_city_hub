import {Request, Response, NextFunction} from 'express';
import {auth} from './auth.middleware';
import EspTokenService from '../modules/services/espToken.service';

const espTokens = new EspTokenService();

// Install this middleware only on the two firmware endpoints. Browser routes
// continue to require a verified, active user JWT.
export const iotAuth = async (request: Request, response: Response, next: NextFunction) => {
    const header = request.headers['x-access-token'] || request.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : header;
    if (typeof token !== 'string' || !token.startsWith('sch_')) return auth(request, response, next);
    try {
        const key = await espTokens.authenticate(token);
        if (!key) return response.status(401).send('Invalid or expired ESP token.');
        response.locals.iotCredential = 'esp';
        response.locals.iotLocation = key.location;
        next();
    } catch {
        return response.status(503).json({error: 'ESP authentication unavailable.'});
    }
};

export const iotSensorAccess = (_request: Request, response: Response, next: NextFunction) => {
    if (response.locals.iotCredential === 'esp' || response.locals.userRole === 'admin') return next();
    return response.status(403).send('Access denied.');
};
