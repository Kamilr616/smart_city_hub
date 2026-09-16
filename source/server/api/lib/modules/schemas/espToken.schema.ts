import {Schema, model} from 'mongoose';

const EspTokenSchema = new Schema({
    name: {type: String, required: true, trim: true, maxlength: 120},
    location: {type: String, required: true, trim: true, maxlength: 120},
    tokenHash: {type: String, required: true, unique: true, select: false},
    createdAt: {type: Date, required: true},
    expiresAt: {type: Date, required: true},
    revokedAt: {type: Date, default: null}
});

export default model('EspTokenKR', EspTokenSchema);
