import DeviceModel from '../schemas/device.schema';
import {config} from "../../config";
import {IDevice} from "../models/device.model";

export default class DeviceService {

    public async getAllUserDevices(loc: string) {
        try {
            return await DeviceModel.find({location: loc}, {__v: 0, _id: 0});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }
    public async getAllUserDevicesByLoc(location: string) {

        try {
            return await DeviceModel.find({location: location}, {__v: 0, _id: 0});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async createDeviceEntry(dataParams: IDevice) {
        try {
            const deviceModel = new DeviceModel(dataParams);
            await deviceModel.save();
        } catch (error) {
            console.error('Wystąpił błąd podczas tworzenia urządzenia', error);
            throw new Error('Wystąpił błąd podczas tworzenia urządzenia');
        }
    }

    public async query(deviceID: string) {
        try {
            return await DeviceModel.find({deviceId: deviceID}, {__v: 0, _id: 0});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async get(deviceID: string) {
        try {
            return await DeviceModel.find({deviceId: deviceID}, {__v: 0, _id: 0}).limit(1).sort({$natural: -1});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanDeviceData(deviceID: string) {
        try {
            await DeviceModel.deleteMany({deviceId: deviceID});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanAllDeviceData() {
        try {
            console.log('Starting to delete all sensor data.');
            const result = await DeviceModel.deleteMany({});
            console.log(`Deleted ${result.deletedCount} documents.`);
            return result.deletedCount;  // Optionally return the number of deleted documents
        } catch (error) {
            console.error(`Query failed: ${error}`);
            // @ts-ignore
            throw new Error(`Query failed: ${error.message}`);  // It's good to use error.message
        }
    }

    public async getAllPeriodDeviceEntry(limitNum: number) {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedDevicesNum}, async (_, i) => {
                try {
                    const latestEntry = await DeviceModel.find({deviceId: i}, {
                        __v: 0,
                        _id: 0
                    }).limit(limitNum).sort({$natural: -1});
                    if (latestEntry.length) {
                        latestData.push(latestEntry[0]);
                    } else {
                        latestData.push({deviceId: i});
                    }
                } catch (error) {
                    // @ts-ignore
                    console.error(`Błąd podczas pobierania danych dla urządzenia ${i + 1}: ${error.message}`);
                    latestData.push({});
                }
            })
        );
        return latestData;
    }

    public async getAllLatestDeviceEntry() {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedDevicesNum}, async (_, i) => {
                try {
                    const latestEntry = await DeviceModel.find({deviceId: i}, {
                        __v: 0,
                        _id: 0
                    }).limit(1).sort({$natural: -1});
                    if (latestEntry.length) {
                        latestData.push(latestEntry[0]);
                    } else {
                        latestData.push({deviceId: i});
                    }
                } catch (error) {
                    // @ts-ignore
                    console.error(`Błąd podczas pobierania danych dla urządzenia ${i + 1}: ${error.message}`);
                    latestData.push({});
                }
            })
        );
        return latestData;
    }
}
