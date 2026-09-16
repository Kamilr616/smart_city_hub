import {createHash, randomBytes} from 'crypto';
import EspTokenModel from '../schemas/espToken.schema';
import DeviceModel from '../schemas/device.schema';
import {SensorDefinitionModel} from '../schemas/sensorDefinition.schema';

export const hashEspToken = (token: string): string => createHash('sha256').update(token).digest('hex');

interface EspKeyRecord {
    _id: unknown;
    name: string;
    location: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt?: Date | null;
}

const metadata = (record: EspKeyRecord) => ({
    id: String(record._id), name: record.name, location: record.location,
    createdAt: record.createdAt, expiresAt: record.expiresAt, revokedAt: record.revokedAt ?? null
});

export default class EspTokenService {
    async list() {
        const records = await EspTokenModel.find({}).sort({createdAt: -1}).lean();
        return records.map(metadata);
    }

    async create({name, location, expiresInDays}: {name: string; location: string; expiresInDays: number}) {
        if (['admin', '*'].includes(location.toLowerCase()) || !location.trim()) {
            throw Object.assign(new Error('Select an existing location.'), {status: 400});
        }
        const [device, sensor] = await Promise.all([
            DeviceModel.exists({location}), SensorDefinitionModel.exists({location})
        ]);
        if (!device && !sensor) throw Object.assign(new Error('Select an existing location.'), {status: 400});
        const token = 'sch_' + randomBytes(32).toString('hex');
        const createdAt = new Date();
        const record = await EspTokenModel.create({
            name, location, tokenHash: hashEspToken(token), createdAt,
            expiresAt: new Date(createdAt.getTime() + expiresInDays * 86400000), revokedAt: null
        });
        return {token, key: metadata(record)};
    }

    async authenticate(token: string) {
        if (!/^sch_[a-f0-9]{64}$/.test(token)) return null;
        const record = await EspTokenModel.findOne({tokenHash: hashEspToken(token)}).lean();
        const expiresAt = record ? new Date(record.expiresAt).getTime() : NaN;
        if (!record || record.revokedAt || !Number.isFinite(expiresAt) || expiresAt <= Date.now()
            || !record.location || ['admin', '*'].includes(record.location.toLowerCase())) return null;
        return record;
    }

    async revoke(id: string) {
        const record = await EspTokenModel.findByIdAndUpdate(id, {$set: {revokedAt: new Date()}}, {new: true});
        return record ? metadata(record) : null;
    }
}
