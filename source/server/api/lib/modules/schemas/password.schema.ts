import { Schema, model } from 'mongoose';

const PasswordSchema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
   password: { type: String, required: true }
});

export default model('PasswordKR', PasswordSchema);
