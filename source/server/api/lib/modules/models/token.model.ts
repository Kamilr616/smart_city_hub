import { Schema } from 'mongoose';

export interface IToken {
   userId: Schema.Types.ObjectId;
   createDate: Number;
   type: string;
   value: string;
}
