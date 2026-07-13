import {Schema, model} from 'mongoose';

export const DeviceSchema: Schema = new Schema({
    location: {type: String, required: true},
    editDate: {type: Date, default: Date.now},
    name: {type: String, default: 'outlet'},
    deviceId: {type: Number, required: true},
    description: {type: String, required: false},
    type: {type: String, default: 'default'},
});

export default model('DeviceKR', DeviceSchema);
