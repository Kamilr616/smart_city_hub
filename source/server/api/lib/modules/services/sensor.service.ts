import SensorModel from '../schemas/sensor.schema';
import {config} from "../../config";
import {ISensor} from "../models/sensor.model";

export default class SensorService {

    public async createSensorData(SensorParams: ISensor) {
        try {
            const sensor = new SensorModel(SensorParams);
            await sensor.save();
        } catch (error) {
            console.error('Wystąpił błąd podczas tworzenia danych:', error);
            throw new Error('Wystąpił błąd podczas tworzenia danych');
        }
    }

    public async query(deviceID: string) {
        try {
            return await SensorModel.find({deviceId: deviceID}, {__v: 0, _id: 0});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async get(deviceID: string) {
        try {
            return await SensorModel.find({deviceId: deviceID}, {__v: 0, _id: 0}).limit(1).sort({$natural: -1});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanSensorData(deviceID: string) {
        try {
            await SensorModel.deleteMany({deviceId: deviceID});
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanAllSensorData() {
        try {
            console.log('Starting to delete all sensor data.');
            const result = await SensorModel.deleteMany({});
            console.log(`Deleted ${result.deletedCount} documents.`);
            return result.deletedCount;  // Optionally return the number of deleted documents
        } catch (error) {
            console.error(`Query failed: ${error}`);
            // @ts-ignore
            throw new Error(`Query failed: ${error.message}`);  // It's good to use error.message
        }
    }

    public async getPeriodSensorDataLatest(limitNum: number) {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedSensorsNum}, async (_, i) => {
                try {
                    const latestEntry = await SensorModel.find({deviceId: i}, {
                        __v: 0,
                        _id: 0
                    }).limit(limitNum).sort({$natural: -1});

                    if (latestEntry.length) {
                        latestData.push(latestEntry);
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
        console.log(latestData);
        return latestData;
    }

    public async getAllNewestSensorData() {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedSensorsNum}, async (_, i) => {
                try {
                    const latestEntry = await SensorModel.find({deviceId: i}, {
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

    //TODO: getAllUserSensorData, getAllUserLatestSensorData service
    async getAllUserSensorDataService(role: string) {
        return [role];
    }

    async getAllUserLatestSensorDataService(role: string) {
        return [role];
    }

    async getAllSensorDataService() {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({length: config.supportedSensorsNum}, async (_, i) => {
                try {
                    const latestEntry = await SensorModel.find({deviceId: i}, {
                        __v: 0,
                        _id: 0
                    }).sort({$natural: -1});
                    if (latestEntry.length) {
                        latestData.push(latestEntry);
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
