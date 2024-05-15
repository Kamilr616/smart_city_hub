import { Schema, model } from 'mongoose';
import { ISensor } from "../models/sensor.model";

export const SensorSchema: Schema = new Schema({
   temperature: { type: Number, required: true },
   pressure: { type: Number, required: true },
   humidity: { type: Number, required: true },
   readingDate: { type: Date, default: Date.now },
   deviceId: {type: Number, required: true}
});
//'Params'
export default model<ISensor>('SensorKR', SensorSchema);
