import DeviceStateModel from '../schemas/deviceState.schema';
import {config} from "../../config";
import {IDeviceState} from "../models/deviceState.model";

export default class DeviceStateService {

    // public async createDeviceStateEntry(dataParams: IDeviceState) {
    //     try {
    //         const deviceModel = new DeviceStateModel(dataParams);
    //         await deviceModel.save();
    //     } catch (error) {
    //         console.error('Wystąpił błąd podczas tworzenia ', error);
    //         throw new Error('Wystąpił błąd podczas tworzenia ');
    //     }
    // }

    public async cleanDeviceData(deviceID: string) {
        try {
            await DeviceStateModel.deleteMany({deviceId: deviceID});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanAllDeviceData() {
        try {
            console.log('Starting to delete all sensor data.');
            const result = await DeviceStateModel.deleteMany({});
            console.log(`Deleted ${result.deletedCount} documents.`);
            return result.deletedCount;  // Optionally return the number of deleted documents
        } catch (error) {
            console.error(`Query failed: ${error}`);
            // @ts-ignore
            throw new Error(`Query failed: ${error.message}`);  // It's good to use error.message
        }
    }

    public async updateDeviceState(deviceStateData: {
        deviceId: number;
        state: boolean;
        timestamp: Date
    }): Promise<void> {
        try {
            // Assuming the method is called 'updateDeviceState'
            await DeviceStateModel.updateOne(
                {deviceId: deviceStateData.deviceId},
                {$push: {states: {state: deviceStateData.state, timestamp: deviceStateData.timestamp}}}
            );
        } catch (error) {
            console.error('Error updating device state:', error);
            throw new Error('Failed to update device state');
        }
    }

    public async updateDeviceStatesBatch(deviceStates: Array<{ deviceId: number; state: boolean }>): Promise<void> {
        try {
            const bulkOps = deviceStates.map(deviceState => ({
                updateOne: {
                    filter: {deviceId: deviceState.deviceId},
                    update: {$push: {states: {state: deviceState.state, timestamp: new Date()}}},
                    upsert: true
                }
            }));

            await DeviceStateModel.bulkWrite(bulkOps);
            console.log('Bulk update operation completed successfully.');
        } catch (error) {
            console.error('Error during bulk update:', error);
            throw new Error('Failed to update device states in bulk');
        }
    }

    public async queryState(deviceID: string) {
        try {
            return await DeviceStateModel.find({deviceId: deviceID}, {__v: 0, _id: 0});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async getState(deviceID: string) {
        try {
            return await DeviceStateModel.find({deviceId: deviceID}, {__v: 0, _id: 0}).limit(1).sort({$natural: -1});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }
public async getAllDeviceStates() {
    try {
        const deviceStates = await DeviceStateModel.find({}, {__v: 0, _id: 0});
        return deviceStates.map(deviceState => deviceState.states[0].state);
    } catch (error) {
        throw new Error(`Query failed: ${error}`);
    }
}
    public async getAllPeriodDeviceStateEntry(limitNum: number) {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedDevicesNum}, async (_, i) => {
                try {
                    const latestEntry = await DeviceStateModel.find({deviceId: i}, {
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

    public async getAllLatestDeviceStateEntry() {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedDevicesNum}, async (_, i) => {
                try {
                    const latestEntry = await DeviceStateModel.find({deviceId: i}, {
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
