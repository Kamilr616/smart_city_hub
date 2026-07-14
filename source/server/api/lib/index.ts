import App from './app';
import IndexController from "./controllers/index.controller";
import SensorController from "./controllers/sensor.controller";
import UserController from "./controllers/user.controller";
import DeviceController from "./controllers/device.controller";
import DeviceStateController from "./controllers/deviceState.controller";
const app: App = new App([
    new UserController(),
    new IndexController(),
    new SensorController(),
    new DeviceController(),
    new DeviceStateController()
]);

void app.listen().catch(error => {
    console.error(`API startup failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
});
