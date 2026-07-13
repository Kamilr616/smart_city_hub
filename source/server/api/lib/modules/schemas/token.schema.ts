import { Schema, model } from 'mongoose';

const tokenTypeEnum = {
   authorization: 'authorization'
};

const tokenTypes = [tokenTypeEnum.authorization];

const TokenSchema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
   createDate: { type: Number, required: true },
   type: { type: String, enum: tokenTypes, required: true },
   value: { type: String, required: true }
});

export default model('TokenKR', TokenSchema);
