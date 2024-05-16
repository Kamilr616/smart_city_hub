import {RequestHandler, Request, Response, NextFunction} from 'express';
import {config} from "../config";

export const checkSensorIdParam: RequestHandler = (request: Request, response: Response, next: NextFunction) => {
    const {id} = request.params;
    const parsedValue = parseInt(id, 10);
    if (isNaN(parsedValue) || parsedValue >= config.supportedSensorsNum) {
        return response.status(400).send('Błąd lub niepoprawny parametr ID urządzenia!');
    }
    next();
};
