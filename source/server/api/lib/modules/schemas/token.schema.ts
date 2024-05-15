import { Schema, model } from 'mongoose';
import {IToken} from "../models/token.model";

const tokenTypeEnum = {
   authorization: 'authorization'
};

const tokenTypes = [tokenTypeEnum.authorization];

const TokenSchema = new Schema<IToken>({
   userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
   createDate: { type: Number, required: true },
   type: { type: String, enum: tokenTypes, required: true },
   value: { type: String, required: true }
});

export default model<IToken>('Token', TokenSchema);
