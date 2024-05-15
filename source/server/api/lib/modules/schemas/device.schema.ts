import {Schema, model} from 'mongoose';
import {IDevice} from "../models/device.model";

export const DeviceSchema: Schema = new Schema({
    location: {type: String, required: true},
    editDate: {type: Date, default: Date.now},
    name: {type: String, default: 'outlet'},
    deviceId: {type: Number, required: true},
    description: {type: String, required: false},
    type: {type: String, default: 'default'},
});

export default model<IDevice>('DeviceKR', DeviceSchema);
