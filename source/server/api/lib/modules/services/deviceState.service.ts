import DeviceStateModel from '../schemas/deviceState.schema';
import { config } from "../../config";
import DeviceModel from "../schemas/device.schema";

export const buildIotStatePayload = (
    deviceStates: Array<Partial<{deviceId: number; states: Array<{state: boolean}>}>>,
    deviceCount: number
): boolean[] => {
    const payload = Array<boolean>(deviceCount).fill(false);

    for (const deviceState of deviceStates) {
        const {deviceId, states} = deviceState;
        if (!Number.isInteger(deviceId) || deviceId === undefined || deviceId < 0 || deviceId >= deviceCount) {
            continue;
        }
        if (!Array.isArray(states) || states.length === 0) {
            continue;
        }
        payload[deviceId] = Boolean(states[states.length - 1].state);
    }

    return payload;
};

import {HistoryRange} from '../models/history.model';

export default class DeviceStateService {
    public async getDeviceHistory(deviceId: number, role: string, {from, to, limit}: HistoryRange) {
        if (typeof role !== 'string' || !role.trim()) return null;
        const authorizedDevice = await DeviceModel.exists(role === 'admin' ? {deviceId} : {deviceId, location: role});
        if (!authorizedDevice) return null;

        // Match the unique device index; sort and limit inside Mongo so the API
        // never loads the complete embedded history into application memory.
        const [history] = await DeviceStateModel.aggregate<{
            baseline: Array<{state: boolean; timestamp: Date}>;
            states: Array<{state: boolean; timestamp: Date}>;
        }>([
            {$match: {deviceId}},
            {$unwind: {path: '$states', includeArrayIndex: 'observationIndex'}},
            {$match: {'states.timestamp': {$type: 'date', $lte: to}, 'states.state': {$type: 'bool'}}},
            {$facet: {
                baseline: [
                    {$match: {'states.timestamp': {$lt: from}}},
                    {$sort: {'states.timestamp': -1, observationIndex: -1}},
                    {$limit: 1},
                    {$project: {_id: 0, state: '$states.state', timestamp: '$states.timestamp'}}
                ],
                states: [
                    {$match: {'states.timestamp': {$gte: from}}},
                    {$sort: {'states.timestamp': -1, observationIndex: -1}},
                    {$limit: limit + 1},
                    {$project: {_id: 0, state: '$states.state', timestamp: '$states.timestamp'}}
                ]
            }}
        ]);
        const states = history?.states ?? [];
        return {
            initialState: history?.baseline[0]?.state ?? null,
            states: states.slice(0, limit).reverse(),
            truncated: states.length > limit
        };
    }


    public async getAllUserDeviceStates(role: string) {
        try {
            let devices;
            // Pobieramy urządzenia na podstawie roli użytkownika
            if (role === 'admin') {
                devices = await DeviceModel.find({}, { __v: 0, _id: 0 }).select('deviceId').lean();
            } else {
                devices = await DeviceModel.find({ location: role }, { __v: 0, _id: 0 }).select('deviceId').lean();
            }
            // Pobieramy identyfikatory urządzeń
            const ids = (devices as Array<Record<string, any>>).map(device => device.deviceId);
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
            const results = await Promise.all(promises as Array<Promise<any[]>>);
            // Spłaszczamy wyniki do jednej tablicy i mapujemy je do oczekiwanego formatu
            // Zwracamy wszystkie stany urządzeń
            return results.flat().map(deviceState => {
                const last = deviceState.states?.[deviceState.states.length - 1];
                return {
                    deviceId: deviceState.deviceId,
                    state: last?.state ?? null,
                    timestamp: last?.timestamp ?? null
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
            const deviceStates = await DeviceStateModel.find(
                {deviceId: {$gte: 0, $lt: config.supportedDevicesNum}},
                {__v: 0, _id: 0}
            ).lean();
            return buildIotStatePayload(deviceStates, config.supportedDevicesNum);
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
            const userDeviceIds = (devices as Array<Record<string, any>>).map(device => device.deviceId);
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
