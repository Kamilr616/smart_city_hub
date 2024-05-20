import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import {checkSensorIdParam} from '../middlewares/deviceIdParam.middleware';
import SensorService from '../modules/services/sensor.service';
import Joi from 'joi';
import {admin} from "../middlewares/admin.middleware";
import {ISensor} from "../modules/models/sensor.model";
import {auth} from "../middlewares/auth.middleware";


class SensorController implements Controller {
    public path = '/api/sensor';
    public router = Router();
    private sensorService: SensorService = new SensorService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        //this.router.get(`${this.path}/user/all`, auth, this.getAllUserSensorData);
        //this.router.get(`${this.path}/user/all/latest`, auth, this.getAllUserLatestSensorData);

        this.router.get(`${this.path}/all/latest`, this.getLatestReadingsFromAllSensor); //auth
        this.router.get(`${this.path}/all/:num`, admin, checkSensorIdParam, this.getPeriodSensorData);
        this.router.get(`${this.path}/all`, this.getPeriodAllSensorData); //auth
        this.router.get(`${this.path}/:id`, admin, checkSensorIdParam, this.getAllSingleSensorData);
        this.router.post(`${this.path}/iot/update`, admin, checkSensorIdParam, this.addMultipleSensorData);  //TODO: NXP auth
        this.router.post(`${this.path}/update/:id`, admin, checkSensorIdParam, this.addSingleSensorData);
        this.router.delete(`${this.path}/all`, admin, this.cleanAllSensorData);
        this.router.delete(`${this.path}/:id`, admin, checkSensorIdParam, this.cleanSingleSensorData);
    }

    private getPeriodAllSensorData = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.sensorService.getPeriodSensorDataLatest(20));
    };

    private getAllSensorData = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.sensorService.getAllSensorDataService());
    };

    private getAllUserSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const role = response.locals.userRole;
        response.status(200).json(await this.sensorService.getAllUserSensorDataService(role));
    };

    private getAllUserLatestSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const role = response.locals.userRole;
        response.status(200).json(await this.sensorService.getAllUserLatestSensorDataService(role));
    };

    private cleanSingleSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        await this.sensorService.cleanSensorData(id);
        response.status(200).json({message: `Dane dla urządzenia ${id} zostały usunięte.`});
    };

    private cleanAllSensorData = async (request: Request, response: Response, next: NextFunction) => {
        await this.sensorService.cleanAllSensorData();
        response.status(200).json({message: `Wszystkie dane zostały usunięte.`});
    };

    private getPeriodSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {num} = request.params;
        const allData = await this.sensorService.getPeriodSensorDataLatest(parseInt(num, 10));
        response.status(200).json(allData);
    };

    private getLatestReadingsFromAllSensor = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.sensorService.getAllNewestSensorData());
    };

    private getAllSingleSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        const allData = await this.sensorService.query(id);
        response.status(200).json(allData);
    };

    private addSingleSensorData = async (request: Request, response: Response, next: NextFunction) => {
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
            const readingData: ISensor = {
                temperature: validatedData.air[0].value,
                pressure: validatedData.air[1].value,
                humidity: validatedData.air[2].value,
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

    private addMultipleSensorData = async (request: Request, response: Response, next: NextFunction) => {
        const {sensorData} = request.body; // Przyjmujemy tablicę obiektów z danymi pomiarowymi dla różnych urządzeń
        // Walidacja danych wejściowych za pomocą biblioteki Joi
        const schema = Joi.array().items(
            Joi.object({
                deviceId: Joi.number().integer().positive().required(), // Sprawdzamy, czy istnieje identyfikator urządzenia
                air: Joi.object({ // Walidujemy dane pomiarowe
                    temperature: Joi.number().required(),
                    pressure: Joi.number().required(),
                    humidity: Joi.number().required()
                }).required()
            })
        );
        try {
            // Sprawdzamy, czy dane wejściowe pasują do określonego schematu
            const validatedData = await schema.validateAsync(sensorData);
            // Przetwarzamy każdy pomiar
            const createdData = await Promise.all(validatedData.map(async (data: any) => {
                const {air} = data;
                const {deviceId} = data;
                const readingData: ISensor = {
                    temperature: air.temperature,
                    pressure: air.pressure,
                    humidity: air.humidity,
                    deviceId: parseInt(deviceId, 10),
                    readingDate: new Date()
                };
                // Tworzymy dane pomiarowe
                await this.sensorService.createSensorData(readingData);

                return readingData; // Zwracamy dane, które zostały utworzone
            }));

            response.status(200).json(createdData); // Zwracamy utworzone dane
        } catch (error) {
            // Obsługa błędów walidacji
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    };

}


export default SensorController;
