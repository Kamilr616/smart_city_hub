import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import PasswordModel from '../modules/schemas/password.schema';
import UserModel from '../modules/schemas/user.schema';

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is required.`);
    }
    return value;
};

const seedInitialAdmin = async (): Promise<void> => {
    const databaseUrl = getRequiredEnv('MONGODB_URI').trim();
    const email = getRequiredEnv('INITIAL_ADMIN_EMAIL').trim();
    const name = getRequiredEnv('INITIAL_ADMIN_NAME').trim();
    const suppliedPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !name) {
        throw new Error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_NAME cannot be blank.');
    }
    if (suppliedPassword && suppliedPassword.length < 12) {
        throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters.');
    }

    await mongoose.connect(databaseUrl);

    const [userWithEmail, userWithName] = await Promise.all([
        UserModel.findOne({email}),
        UserModel.findOne({name})
    ]);

    if (userWithEmail && userWithName && !userWithEmail._id.equals(userWithName._id)) {
        throw new Error('The requested administrator email and name belong to different users.');
    }

    const existingUser = userWithEmail ?? userWithName;
    if (existingUser) {
        if (existingUser.email !== email || existingUser.name !== name) {
            throw new Error('An existing user matches only the requested administrator email or name.');
        }
        const hasPassword = await PasswordModel.exists({userId: existingUser._id});
        if ((existingUser.isAdmin || existingUser.role === 'admin') && hasPassword) {
            console.log('Initial administrator already exists; no changes were made.');
            return;
        }
        throw new Error('A non-administrator or incomplete user already uses the requested email or name.');
    }

    const password = getRequiredEnv('INITIAL_ADMIN_PASSWORD');
    if (password.length < 12) {
        throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const administrator = await UserModel.create({
        email,
        name,
        role: 'admin',
        active: true,
        isAdmin: true
    });

    try {
        await PasswordModel.create({
            userId: administrator._id,
            password: passwordHash
        });
    } catch (error) {
        await UserModel.deleteOne({_id: administrator._id});
        throw error;
    }

    console.log(`Initial administrator created for ${email}.`);
};

const run = async (): Promise<void> => {
    try {
        await seedInitialAdmin();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Administrator seed failed: ${message}`);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

void run();
