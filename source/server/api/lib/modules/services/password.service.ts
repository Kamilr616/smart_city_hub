import PasswordModel  from '../schemas/password.schema';
import bcrypt from 'bcrypt';

class PasswordService {
   public async createOrUpdate(data: any) {
       const result = await PasswordModel.findOneAndUpdate({ userId: data.userId }, { $set: { password: data.password } }, { new: true });
       if (!result) {
           const dataModel = new PasswordModel({ userId: data.userId, password: data.password });
           return await dataModel.save();
       }
       return result;
   }

   public async authorize(userId: string, password: string): Promise<boolean> {
       try {
           const result = await PasswordModel.findOne({ userId });
           return result ? await bcrypt.compare(password, result.password) : false;
       } catch (error) {
           console.error('Wystąpił błąd podczas tworzenia danych:', error);
           throw new Error('Wystąpił błąd podczas tworzenia danych');
       }

   }

   async hashPassword(password: string): Promise<string> {
       const saltRounds = 10;
       const hashedPassword = await bcrypt.hash(password, saltRounds);
       return hashedPassword;
   }

}

export default PasswordService;
