import { Schema, model } from 'mongoose';
import {IUser} from "../models/user.model";

const UserSchema = new Schema<IUser>({
   email: { type: String, required: true, unique: true },
   name: { type: String, required: true, unique: true },
   role: { type: String, enum: ['admin', 'user'], default: 'user' },
   active: { type: Boolean, default: true },
   isAdmin: { type: Boolean, default: true }
});

export default model<IUser>('UserKR', UserSchema)
