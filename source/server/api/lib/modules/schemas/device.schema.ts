import {Schema, model} from 'mongoose';

export const DeviceSchema: Schema = new Schema({
    location: {type: String, required: true},
    editDate: {type: Date, default: Date.now},
    name: {type: String, default: 'outlet'},
    deviceId: {type: Number, required: true, unique: true, min: 0, max: 95},
    description: {type: String, required: false},
    type: {type: String, default: 'default'},
});

export default model('DeviceKR', DeviceSchema);
