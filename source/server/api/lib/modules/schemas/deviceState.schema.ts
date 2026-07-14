import {Schema, model} from 'mongoose';

export interface DeviceStateDocument {
    deviceId: number;
    states: Array<{
        state: boolean;
        timestamp: Date;
    }>;
}

const DeviceStateSchema = new Schema<DeviceStateDocument>({
    deviceId: {
        type: Number,
        required: true,
        unique: true,
        min: 0,
        max: 95,
        ref: 'Device'  // Reference to the Device collection
    },
    states: [{
        state: { type: Boolean, required: true, default: false},
        timestamp: { type: Date, default: Date.now }
    }]
});


export default model<DeviceStateDocument>('DeviceStateKR', DeviceStateSchema);
