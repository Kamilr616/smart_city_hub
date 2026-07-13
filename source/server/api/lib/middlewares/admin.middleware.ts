import {Request, Response, NextFunction} from 'express';
import {verifyActiveToken} from './auth.middleware';

export const admin = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const authentication = await verifyActiveToken(request);
        if (!authentication) {
            return response.status(401).send('Access denied or session expired.');
        }
        if (!authentication.user.isAdmin && authentication.user.role !== 'admin') {
            return response.status(403).send('Access denied.');
        }
        response.locals.userRole = authentication.user.role;
        response.locals.userId = authentication.user.userId;
        response.locals.authToken = authentication.token;
        next();
    } catch (ex) {
        return response.status(401).send('Invalid token.');
    }
};
