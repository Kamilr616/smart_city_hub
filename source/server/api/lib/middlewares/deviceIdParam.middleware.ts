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

export const checkSensorLimitParam: RequestHandler = (request: Request, response: Response, next: NextFunction) => {
    const limit = Number(request.params.num);
    if (!Number.isInteger(limit) || limit <= 0) {
        return response.status(400).send('Invalid sensor reading limit.');
    }
    next();
};
