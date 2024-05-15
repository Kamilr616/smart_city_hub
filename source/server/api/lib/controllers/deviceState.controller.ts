import Controller from '../interfaces/controller.interface';
import {Request, Response, NextFunction, Router} from 'express';
import {checkIdParam} from '../middlewares/deviceIdParam.middleware';
import DeviceStateService from '../modules/services/deviceState.service';
import Joi from 'joi';
import {admin} from '../middlewares/admin.middleware';
//import {auth} from '../middlewares/auth.middleware';
import {userRole} from '../middlewares/userRole.middleware';

class DeviceStateController implements Controller {
    public path = '/api/state';
    public router = Router();
    private deviceStateService: DeviceStateService = new DeviceStateService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(`${this.path}/all`, this.getAllDeviceStates);//TODO: NXP auth
        this.router.get(`${this.path}/get`, userRole, this.getAllUserDeviceStates);

        this.router.get(`${this.path}/latest`, this.getLatestStateFromAllDevice);
        this.router.post(`${this.path}/update`, this.updateMultipleDeviceStates);
        this.router.post(`${this.path}/update/:id`, checkIdParam, this.updateDeviceState);
        this.router.get(`${this.path}/all/:id`, checkIdParam, this.getAllDeviceStateData);
        this.router.get(`${this.path}/:id`, checkIdParam, this.getDeviceState);

        this.router.delete(`${this.path}/all`, admin, this.cleanAllDeviceStateData);
        this.router.delete(`${this.path}/:id`, admin, checkIdParam, this.removeDeviceState);
    }

    private getAllUserDeviceStates = async (request: Request, response: Response, next: NextFunction) => {
        const role = response.locals.userRole;
        const allUserDeviceStates = await this.deviceStateService.getAllUserDeviceStates(role);

        response.status(200).json(allUserDeviceStates);
    };

    private getAllDeviceStates = async (request: Request, response: Response, next: NextFunction) => {
        const allDeviceStates = await this.deviceStateService.getAllDeviceStates();
        response.status(200).json(allDeviceStates);
    };
    private cleanAllDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        await this.deviceStateService.cleanAllDeviceData();
        response.status(200).json({message: `Wszystkie dane zostały usunięte.`});
    }
    private getAllDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        const allData = await this.deviceStateService.queryState(id);
        response.status(200).json(allData);
    };
    private getLatestStateFromAllDevice = async (request: Request, response: Response, next: NextFunction) => {
        const allData = await this.deviceStateService.getAllLatestDeviceStateEntry();
        response.status(200).json(allData);
    }

    private removeDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        await this.deviceStateService.cleanDeviceData(id);
        response.status(200).json({message: `Urządzenie ${id} zostało usunięte.`});
    }


    private getDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        const allData = await this.deviceStateService.queryState(id);
        response.status(200).json(allData);
    };

    private updateDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const {state} = request.body;
        const {id} = request.params; // Assuming id is the deviceId

        const schema = Joi.object({
            state: Joi.boolean().required(),
            deviceId: Joi.number().integer().required()
        });

        try {
            // Validate the incoming data
            const validatedData = await schema.validateAsync({state, deviceId: id});

            // Prepare data for updating
            const newState = {
                deviceId: validatedData.deviceId,
                state: validatedData.state,
                timestamp: new Date()
            };

            // Call service to update the device state
            await this.deviceStateService.updateDeviceState(newState);
            response.status(200).json(newState);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    }
    private updateMultipleDeviceStates = async (request: Request, response: Response, next: NextFunction) => {
        const deviceStates = request.body.deviceStates; // Array of {deviceId, state}

        // Define Joi schema for validation
        const schema = Joi.object({
            deviceId: Joi.number().integer().required(),
            state: Joi.boolean().required()
        });

        try {
            // Validate each item in the array
            await Promise.all(deviceStates.map((deviceState: any) => schema.validateAsync(deviceState)));

            // Update states for all devices
            await this.deviceStateService.updateDeviceStatesBatch(deviceStates);
            response.status(200).json({message: "Device states updated successfully."});
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    }
}


export default DeviceStateController;
