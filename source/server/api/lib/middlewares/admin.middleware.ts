import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from "../modules/models/user.model";

export const admin = (request: Request, response: Response, next: NextFunction) => {
   // @ts-ignore
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
               if (!user.isAdmin) {
                   return response.status(403).send('Access denied.');
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
