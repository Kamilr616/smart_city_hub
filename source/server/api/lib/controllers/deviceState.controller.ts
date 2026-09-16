import Controller from '../interfaces/controller.interface';
import {parseHistoryRequest} from '../modules/models/history.model';
import {Request, Response, NextFunction, Router} from 'express';
import DeviceStateService from '../modules/services/deviceState.service';
import Joi from 'joi';
import {iotAuth} from '../middlewares/iotAuth.middleware';
import {admin} from '../middlewares/admin.middleware';
import {auth} from "../middlewares/auth.middleware";
import {config} from "../config";

class DeviceStateController implements Controller {
    public path = '/api/state';
    public router = Router();
    private deviceStateService: DeviceStateService = new DeviceStateService();

    constructor() {
        this.initializeRoutes();
    }


    private getDeviceHistory = async (request: Request, response: Response) => {
        let range;
        try {
            range = parseHistoryRequest(request.params.id, request.query, config.supportedDevicesNum);
        } catch {
            response.status(400).json({error: 'Invalid history ID, ISO range or limit.'});
            return;
        }
        try {
            const {deviceId, from, to} = range;
            const history = await this.deviceStateService.getDeviceHistory(deviceId, response.locals.userRole, range);
            if (!history) {
                response.status(404).json({error: 'Device not found.'});
                return;
            }
            response.status(200).json({deviceId, from, to, ...history});
        } catch {
            response.status(503).json({error: 'History unavailable.'});
        }
    };

    private initializeRoutes() {
        this.router.get(`${this.path}/history/:id`, auth, this.getDeviceHistory);
        this.router.get(`${this.path}/iot/all`, iotAuth, this.getAllLatestIotDeviceState);
        this.router.get(`${this.path}/user/latest`, auth, this.getAllLatestUserDeviceState);
        this.router.get(`${this.path}/latest`, admin, this.getAllLatestDeviceState);
        this.router.get(`${this.path}/all`, admin, this.getAllDeviceStateData);
        this.router.post(`${this.path}/user/update`, auth, this.updateMultipleUserDeviceState);
        this.router.post(`${this.path}/update`, admin, this.updateMultipleDeviceState);
        this.router.post(`${this.path}/update/:id`, admin, this.updateSingleDeviceState);
        this.router.get(`${this.path}/:id`, admin, this.getSingleDeviceStateData);
        this.router.delete(`${this.path}/all`, admin, this.cleanAllDeviceStateData);
        this.router.delete(`${this.path}/:id`, admin, this.cleanSingleDeviceStateData);
    }

    private getAllLatestUserDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const role = response.locals.userRole;
        response.status(200).json(await this.deviceStateService.getAllUserDeviceStates(role));
    };

    private getAllLatestIotDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const location = response.locals.iotCredential === 'esp'
            ? response.locals.iotLocation
            : response.locals.userRole === 'admin' ? undefined : response.locals.userRole;
        const unrestricted = response.locals.iotCredential !== 'esp' && response.locals.userRole === 'admin';
        if (!unrestricted && (typeof location !== 'string' || !location.trim())) {
            response.status(403).json({error: 'Location access required.'});
            return;
        }
        try {
            response.status(200).json(await this.deviceStateService.getAllLatestDeviceStatesService(location));
        } catch {response.status(503).json({error: 'Device states unavailable.'});}
    };

    private getAllDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.deviceStateService.getAllDeviceStateDataService());
    };

    private cleanAllDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        await this.deviceStateService.cleanAllDeviceStateDataService();
        response.status(200).json({message: `Wszystkie dane zostały usunięte.`});
    };

    private getSingleDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        response.status(200).json(await this.deviceStateService.queryState(id));
    };

    private getAllLatestDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        response.status(200).json(await this.deviceStateService.getAllLatestDeviceStateService());
    };

    private cleanSingleDeviceStateData = async (request: Request, response: Response, next: NextFunction) => {
        const {id} = request.params;
        await this.deviceStateService.cleanSingleDeviceStateDataService(id);
        response.status(200).json({message: `Urządzenie ${id} zostało usunięte.`});
    };

    private updateSingleDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const {state} = request.body;
        const {id} = request.params; // Assuming id is the deviceId
        const schema = Joi.object({
            state: Joi.boolean().required(),
            deviceId: Joi.number().integer().min(0).max(config.supportedDevicesNum - 1).required()
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
            await this.deviceStateService.updateSingleDeviceStateService(newState);
            response.status(200).json(newState);
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    };

    private updateMultipleDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const deviceStates = request.body.deviceStates; // Array of {deviceId, state}
        // Define Joi schema for validation
        const schema = Joi.object({
            deviceId: Joi.number().integer().min(0).max(config.supportedDevicesNum - 1).required(),
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
    };

    private updateMultipleUserDeviceState = async (request: Request, response: Response, next: NextFunction) => {
        const deviceStates = request.body.deviceStates; // Array of {deviceId, state}
        // Define Joi schema for validation
        const schema = Joi.object({
            deviceId: Joi.number().integer().min(0).max(config.supportedDevicesNum - 1).required(),
            state: Joi.boolean().required()
        });
        try {
            // Validate each item in the array
            await Promise.all(deviceStates.map((deviceState: any) => schema.validateAsync(deviceState)));
            const role = response.locals.userRole;
            // Update states for all devices
            await this.deviceStateService.updateUserDeviceStatesBatch(deviceStates, role);
            response.status(200).json({message: "Device states updated successfully."});
        } catch (error) {
            // @ts-ignore
            console.error(`Validation Error: ${error.message}`);
            response.status(400).json({error: 'Invalid input data.'});
        }
    };
}


export default DeviceStateController;
