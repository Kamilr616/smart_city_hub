import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import {checkIdParam} from '../middlewares/deviceIdParam.middleware';
import SensorService from '../modules/services/sensor.service';
import Joi from 'joi';
// import {config} from "../config";
// import {ISensor} from "../modules/models/sensor.model";

class SensorController implements Controller {
    public path = '/api/sensor';
    public router = Router();
    private sensorService: SensorService = new SensorService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/latest`, this.getLatestReadingsFromAllSensor);
        this.router.get(`${this.path}/:id`, checkIdParam, this.getAllSensorData);
        this.router.get(`${this.path}/:id/latest`, checkIdParam, this.getPeriodSensorData);
        this.router.get(`${this.path}/:id/:num`, checkIdParam, this.getPeriodSensorData);
        this.router.post(`${this.path}/:id`, checkIdParam, this.addSensorData);
        this.router.delete(`${this.path}/all`, this.cleanAllSensorData);
        this.router.delete(`${this.path}/:id`, checkIdParam, this.cleanSensorData);
    }

    private cleanSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        await this.sensorService.cleanSensorData(id);
        response.status(200).json({message: `Dane dla urządzenia ${id} zostały usunięte.`});
    }

    private cleanAllSensorData = async (request: Request, response: Response, next: NextFunction) => {
        await this.sensorService.cleanAllSensorData();
        response.status(200).json({message: `Wszystkie dane zostały usunięte.`});
    }

    private getPeriodSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {id, num} = request.params;
        let allData: any[] = [];
        if (num) {
            allData = await this.sensorService.getPeriodSensorDataLatest(parseInt(num));
        } else {
            allData = await this.sensorService.get(id);
        }
        response.status(200).json(allData);
    }

    private getLatestReadingsFromAllSensor = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        const allData = await this.sensorService.getAllNewestSensorData();
        response.status(200).json(allData);
    }

    private getAllSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        const allData = await this.sensorService.query(id);
        response.status(200).json(allData);
    };

    private addSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {air} = request.body;
        const {id} = request.params;
        const schema = Joi.object({
            air: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.number().integer().positive().required(),
                        value: Joi.number().required()
                    })
                )
                .unique((a, b) => a.id === b.id),
            deviceId: Joi.number().integer().valid().required()
        });

        try {
            const validatedData = await schema.validateAsync({air, deviceId: id});
            // @ts-ignore
            const readingData: IData = {
                temperature: air[0].value,
                pressure: air[1].value,
                humidity: air[2].value,
                deviceId: parseInt(id, 10),
                readingDate: new Date()
            };

            await this.sensorService.createSensorData(readingData);
            response.status(200).json(readingData);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    };
}


export default SensorController;
