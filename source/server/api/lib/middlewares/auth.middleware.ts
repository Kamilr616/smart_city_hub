import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {config} from '../config';
import {IUser} from "../modules/models/user.model";
import TokenModel from '../modules/schemas/token.schema';

export interface AuthenticatedUser extends IUser {
    userId: string;
}

export const verifyActiveToken = async (request: Request): Promise<{ user: AuthenticatedUser; token: string } | null> => {
    let token = request.headers['x-access-token'] || request.headers['authorization'];
    if (!token || typeof token !== 'string') {
        return null;
    }
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    const user = jwt.verify(token, config.JwtSecret) as AuthenticatedUser;
    const activeToken = await TokenModel.exists({value: token, userId: user.userId});
    return activeToken ? {user, token} : null;
};

export const auth = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const authentication = await verifyActiveToken(request);
        if (!authentication) {
            return response.status(401).send('Access denied or session expired.');
        }
        response.locals.userRole = authentication.user.role;
        response.locals.userId = authentication.user.userId;
        response.locals.authToken = authentication.token;
        next();
    } catch (ex) {
        return response.status(401).send('Invalid token.');
    }
};
