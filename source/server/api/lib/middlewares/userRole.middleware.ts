import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from "../modules/models/user.model";

export const checkUserRole = (requiredRoles: string[]) => {
    return (request: Request, response: Response, next: NextFunction) => {
        let token = request.headers['x-access-token'] || request.headers['authorization'];
        if (token && typeof token === 'string') {
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }
            try {
                jwt.verify(token, config.JwtSecret, (err, decoded) => {
                    if (err) {
                        return response.status(400).send('Invalid token.');
                    }
                    const user: IUser = decoded as IUser;
                    // @ts-ignore
                    const hasRequiredRole = requiredRoles.every(role => user.role.includes(role));

                    if (!hasRequiredRole) {
                        return response.status(403).send('Access Denied: You do not have the right role.');
                    }
                    next();
                    return;
                });
            } catch (ex) {
                return response.status(400).send('Invalid token.');
            }
        } else {
            return response.status(401).send('Access denied. No token provided.');
        }
    };
};
