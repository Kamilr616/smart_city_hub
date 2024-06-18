require('dotenv').config()

interface Config {
    port: string;
    supportedDevicesNum: number;
    supportedSensorsNum: number;
    JwtSecret: string;
    databaseUrl: string;
}

const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

export const config: Config = {
    port: getEnvVariable('PORT'),
    supportedDevicesNum: 96,
    supportedSensorsNum: 2,
    JwtSecret: getEnvVariable('JWT_SECRET_KEY'),
    databaseUrl: getEnvVariable('MONGODB_URI')
};
