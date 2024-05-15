import { Schema } from 'mongoose';

export interface IPassword {
   userId: Schema.Types.ObjectId;
   password: string;
}
