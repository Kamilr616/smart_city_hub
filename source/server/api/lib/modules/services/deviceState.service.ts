import DeviceStateModel from '../schemas/deviceState.schema';
import { config } from "../../config";
import DeviceModel from "../schemas/device.schema";

export default class DeviceStateService {

    public async getAllUserDeviceStates(role: string) {
        try {
            let devices;
            // Pobieramy urządzenia na podstawie roli użytkownika
            if (role === 'admin') {
                devices = await DeviceModel.find({}, { __v: 0, _id: 0 });
            } else {
                devices = await DeviceModel.find({ location: role }, { __v: 0, _id: 0 });
            }
            // Pobieramy identyfikatory urządzeń
            const ids = devices.map(device => device.deviceId);
            // Tworzymy tablicę obietnic dla wszystkich zapytań do bazy danych o stany urządzeń
            const promises = ids.map(id =>
                DeviceStateModel.find({ deviceId: id }, { __v: 0, _id: 0 })
                    .catch(error => {
                        console.error(`Failed to fetch device states for deviceId ${id}: ${error}`);
                        // W przypadku błędu zwracamy pustą tablicę
                        return [];
                    })
            );
            // Wykonujemy wszystkie zapytania równolegle
            const results = await Promise.all(promises);
            // Spłaszczamy wyniki do jednej tablicy i mapujemy je do oczekiwanego formatu
            // Zwracamy wszystkie stany urządzeń
            return results.flat().map(deviceState => {
                const lastIndex = deviceState.states.length - 1;
                return {
                    deviceId: deviceState.deviceId,
                    state: deviceState.states[lastIndex].state,
                    timestamp: deviceState.states[lastIndex].timestamp
                };
            });
        } catch (error) {
            // Obsługa błędów w przypadku nieudanej próby pobrania urządzeń
            throw new Error(`Failed to fetch devices for ${role}: ${error}`);
        }
    }

    public async cleanSingleDeviceStateDataService(deviceID: string) {
        try {
            await DeviceStateModel.deleteMany({ deviceId: deviceID });
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async cleanAllDeviceStateDataService() {
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

    public async updateSingleDeviceStateService(deviceStateData: {
        deviceId: number;
        state: boolean;
        timestamp: Date
    }): Promise<void> {
        try {
            // Assuming the method is called 'updateDeviceState'
            await DeviceStateModel.updateOne(
                { deviceId: deviceStateData.deviceId },
                { $push: { states: { state: deviceStateData.state, timestamp: deviceStateData.timestamp } } }
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
                    filter: { deviceId: deviceState.deviceId },
                    update: { $push: { states: { state: deviceState.state, timestamp: new Date() } } },
                    upsert: true
                }
            }));
            await DeviceStateModel.bulkWrite(bulkOps);
        } catch (error) {
            console.error('Error during bulk update:', error);
            throw new Error('Failed to update device states in bulk');
        }
    }

    public async queryState(deviceID: string) {
        try {
            return await DeviceStateModel.find({ deviceId: deviceID }, { __v: 0, _id: 0 });
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async getState(deviceID: string) {
        try {
            return await DeviceStateModel.find({ deviceId: deviceID }, { __v: 0, _id: 0 }).limit(1).sort({ $natural: -1 });
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async getAllLatestDeviceStatesService() {
        try {
            const deviceStates = await DeviceStateModel.find({}, { __v: 0, _id: 0 });
            return deviceStates.map(deviceState => deviceState.states[deviceState.states.length - 1].state);
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async getAllDeviceStateDataService() {
        try {
            return await DeviceStateModel.find({}, { __v: 0, _id: 0 });//.map(deviceState => deviceState.states[0].state);
        } catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }

    public async getAllPeriodDeviceStateEntry(limitNum: number) {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({ length: config.supportedDevicesNum }, async (_, i) => {
                try {
                    const latestEntry = await DeviceStateModel.find({ deviceId: i }, {
                        __v: 0,
                        _id: 0
                    }).limit(limitNum).sort({ $natural: -1 });
                    if (latestEntry.length) {
                        latestData.push(latestEntry[0]);
                    } else {
                        latestData.push({ deviceId: i });
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

    public async getAllLatestDeviceStateService() {
        let latestData: any[] = [];
        await Promise.all(
            Array.from({ length: config.supportedDevicesNum }, async (_, i) => {
                try {
                    const latestEntry = await DeviceStateModel.find({ deviceId: i }, {
                        __v: 0,
                        _id: 0
                    }).limit(1).sort({ $natural: -1 });
                    if (latestEntry.length) {
                        latestData.push(latestEntry[0]);
                    } else {
                        latestData.push({ deviceId: i });
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

    public async updateUserDeviceStatesBatch(deviceStates: Array<{
        deviceId: number;
        state: boolean
    }>, role: string): Promise<void> {
        try {
            // Fetch the devices for the user's role
            let devices;
            if (role === 'admin') {
                devices = await DeviceModel.find({}, { __v: 0, _id: 0 });
            } else {
                devices = await DeviceModel.find({ location: role }, { __v: 0, _id: 0 });
            }
            const userDeviceIds = devices.map(device => device.deviceId);
            // Filter the deviceStates array to only include devices that the user has access to
            const validDeviceStates = deviceStates.filter(deviceState => userDeviceIds.includes(deviceState.deviceId));

            // If there are no valid devices, throw an error
            if (validDeviceStates.length === 0) {
                console.error('No valid devices found for the user role');
            }
            // Proceed with the bulk update operation for the valid devices
            const bulkOps = validDeviceStates.map(deviceState => ({
                updateOne: {
                    filter: { deviceId: deviceState.deviceId },
                    update: { $push: { states: { state: deviceState.state, timestamp: new Date() } } },
                    upsert: true
                }
            }));

            await DeviceStateModel.bulkWrite(bulkOps);
        } catch (error) {
            console.error('Error during bulk update:', error);
            throw new Error('Failed to update device states in bulk');
        }
    }
}
