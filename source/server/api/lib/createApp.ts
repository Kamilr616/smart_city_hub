import type {Application} from 'express';
import App from './app';
import UserController from './controllers/user.controller';
import IndexController from './controllers/index.controller';
import SensorController from './controllers/sensor.controller';
import DeviceController from './controllers/device.controller';
import DeviceStateController from './controllers/deviceState.controller';

export function createApp(): Application {
    return new App([
        new UserController(),
        new IndexController(),
        new SensorController(),
        new DeviceController(),
        new DeviceStateController()
    ]).app;
}