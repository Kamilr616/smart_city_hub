import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
   email: { type: String, required: true, unique: true },
   name: { type: String, required: true, unique: true },
   role: { type: String, default: 'user' },
   active: { type: Boolean, default: true },
   isAdmin: { type: Boolean, default: false }
});

export default model('UserKR', UserSchema)
