import { Schema, model } from 'mongoose';

export const SensorSchema = new Schema({
   temperature: { type: Number, required: true },
   pressure: { type: Number, required: true },
   humidity: { type: Number, required: true },
   readingDate: { type: Date, default: Date.now },
   deviceId: {type: Number, required: true}
});

export const SensorModel = model('SensorKR', SensorSchema);
