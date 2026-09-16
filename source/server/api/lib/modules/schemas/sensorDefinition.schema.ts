import {Schema, model} from 'mongoose';
import {config} from '../../config';

export interface SensorDefinition {
    deviceId: number;
    name: string;
    description: string;
    location: string;
}

const SensorDefinitionSchema = new Schema({
    deviceId: {type: Number, required: true, unique: true, min: 0, max: config.supportedSensorsNum - 1},
    name: {type: String, required: true, trim: true, maxlength: 120},
    description: {type: String, default: '', maxlength: 1000},
    location: {type: String, required: true, trim: true, maxlength: 120},
    type: {type: String, default: 'environmental', enum: ['environmental']},
    measurements: {
        type: [{_id: false, kind: String, unit: String}],
        default: () => [
            {kind: 'temperature', unit: '°C'},
            {kind: 'humidity', unit: '%'},
            {kind: 'pressure', unit: 'hPa'}
        ]
    }
});

// Metadata has its own collection; registration never inserts a SensorKR reading.
export const SensorDefinitionModel = model('SensorDefinitionKR', SensorDefinitionSchema);
