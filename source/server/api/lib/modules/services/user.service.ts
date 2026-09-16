import UserModel from '../schemas/user.schema';
import {IUser} from '../models/user.model';
import mongoose from 'mongoose';
import PasswordService from './password.service';
import TokenService from './token.service';

export class UserManagementError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export const publicUser = (user: any) => ({
    _id: String(user._id), name: user.name, email: user.email,
    role: user.role, isAdmin: user.isAdmin === true, active: user.active !== false
});
const isAdministrator = (user: any) => user.isAdmin === true || user.role === 'admin';

class UserService {
    public async list() {
        return (await UserModel.find({}, {name: 1, email: 1, role: 1, isAdmin: 1, active: 1})).map(publicUser);
    }
    public async create(user: Omit<IUser, '_id'>, passwordHash: string) {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const created = await new UserModel(user).save({session});
                await new PasswordService().createOrUpdate({userId: created._id, password: passwordHash}, session);
                return created;
            });
        } finally { await session.endSession(); }
    }
    public async update(id: string, changes: Partial<IUser>, actorId: string, passwordHash?: string) {
        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                const actor = await UserModel.findById(actorId, null, {session});
                if (!actor || actor.active === false || !isAdministrator(actor)) {
                    throw new UserManagementError(403, 'Administrator access is required.');
                }
                // Write both actor and target so reciprocal administrator edits conflict.
                // MongoDB retries with a fresh snapshot, where revoked actor rights fail above.
                await UserModel.updateOne({_id: actorId}, {$inc: {managementVersion: 1}}, {session});
                const user = await UserModel.findById(id, null, {session});
                if (!user) throw new UserManagementError(404, 'User not found.');
                const updated = {...publicUser(user), ...changes};
                if (String(user._id) === String(actor._id) && (updated.active === false ||
                    (user.isAdmin && changes.isAdmin === false) ||
                    (user.role === 'admin' && changes.role !== undefined && changes.role !== 'admin'))) {
                    throw new UserManagementError(409, 'You cannot remove your own administrator access or deactivate your account.');
                }
                if (user.active !== false && isAdministrator(user) && (updated.active === false || !isAdministrator(updated))) {
                    const administrators = await UserModel.countDocuments({active: {$ne: false}, $or: [{isAdmin: true}, {role: 'admin'}]}, {session});
                    if (administrators <= 1) throw new UserManagementError(409, 'The last active administrator must remain active.');
                }
                const result = await UserModel.findByIdAndUpdate(id, {$set: changes, $inc: {managementVersion: 1, sessionVersion: 1}}, {new: true, runValidators: true, session});
                if (!result) throw new UserManagementError(404, 'User not found.');
                if (passwordHash !== undefined) {
                    await new PasswordService().createOrUpdate({userId: user._id, password: passwordHash}, session);
                }
                await new TokenService().removeForUser(id, session);
                return result;
            });
        } finally { await session.endSession(); }
    }
    public async getByEmailOrName(name: string) {
        return UserModel.findOne({$or: [{email: name}, {name}]});
    }
}
export default UserService;
