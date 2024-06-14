import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import DeviceService from '../modules/services/device.service';
import Joi from 'joi';
import {IDevice} from "../modules/models/device.model";
import {admin} from "../middlewares/admin.middleware";
import {auth} from "../middlewares/auth.middleware";

class DeviceController implements Controller {
    public path = '/api/device';
    public router = Router();
    private deviceService: DeviceService = new DeviceService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/latest`, admin, this.getLatestReadingsFromAllDevice);
        this.router.get(`${this.path}/get/:location`, admin, this.getAllUserDevicesByLoc);
        this.router.get(`${this.path}/user/get`, auth, this.getAllUserDevices);
        this.router.get(`${this.path}/all/:id`, admin, this.getAllDeviceData);
        this.router.post(`${this.path}/update`, admin, this.updateDevice);
        this.router.get(`${this.path}/:id`, admin, this.getDeviceData);
        this.router.delete(`${this.path}/all`, admin, this.cleanAllDeviceData);
        this.router.delete(`${this.path}/:id`, admin, this.removeDevice);
    }

    private getAllUserDevices = async (request: Request, response: Response, next: NextFunction) => {
        const loc = response.locals.userRole;
        response.status(200).json(await this.deviceService.getAllUserDevices(loc));
    };

    private getAllUserDevicesByLoc = async (request: Request, response: Response, next: NextFunction) => {
        const {location} = request.params;
        response.status(200).json(await this.deviceService.getAllUserDevicesByLoc(location));
    };

    private cleanAllDeviceData = async (request: Request, response: Response, next: NextFunction) => {
        await this.deviceService.cleanAllDeviceData();
        response.status(200).json({message: `Wszystkie dane zostały usunięte.`});
    };

    private getAllDeviceData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        response.status(200).json(await this.deviceService.query(id));
    };

    private getLatestReadingsFromAllDevice = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.deviceService.getAllLatestDeviceEntry());
    };

    private removeDevice = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        await this.deviceService.cleanDeviceData(id);
        response.status(200).json({message: `Urządzenie ${id} zostało usunięte.`});
    };

    private getDeviceData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        response.status(200).json(await this.deviceService.query(id));
    };

    private updateDevice = async (request: Request, response: Response, next: NextFunction) => {
        const {location, name, description, type, id} = request.body;
        //const {id} = request.params;
        const schema = Joi.object({
            location: Joi.string().allow('').required(),
            name: Joi.string().allow(''), // default value if not provided
            description: Joi.string().allow(''), // optional, allows empty string
            type: Joi.string(), // default value if not provided
            deviceId: Joi.number().integer().required().valid()
        });

        try {
            const validatedData = await schema.validateAsync({location, name, description, type, deviceId: id});
            const deviceData: IDevice = {
                name: validatedData.name || 'outlet', // use outlet if not provided
                location: validatedData.location,
                description: validatedData.description,
                type: validatedData.type || 'default', // use default if not provided
                deviceId: validatedData.deviceId,
                editDate: new Date() // default to current date/time
            };

            await this.deviceService.createDeviceEntry(deviceData);
            response.status(200).json(deviceData);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    };

}


export default DeviceController;
