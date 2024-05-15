import {Schema, model} from 'mongoose';
import {IDeviceState} from "../models/deviceState.model";

const DeviceStateSchema = new Schema({
    deviceId: {
        type: Number,
        required: true,
        ref: 'Device'  // Reference to the Device collection
    },
    states: [{
        state: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
});


export default model<IDeviceState>('DeviceStateKR', DeviceStateSchema);
