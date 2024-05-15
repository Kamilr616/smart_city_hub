import { Schema, model } from 'mongoose';
import {IPassword} from "../models/password.model";

const PasswordSchema = new Schema<IPassword>({
   userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
   password: { type: String, required: true }
});

export default model<IPassword>('Password', PasswordSchema);
