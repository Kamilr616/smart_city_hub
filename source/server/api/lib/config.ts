require('dotenv').config()

interface Config {
    port: string;
    supportedDevicesNum: number;
    supportedSensorsNum: number;
    JwtSecret: string;
    databaseUrl: string;
    corsOrigins: string[];
}

const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
}

const DEFAULT_CORS_ORIGINS = ['http://localhost:5173'] as const;

export const parseCorsOrigins = (value: string | undefined): string[] => {
    const origins = (value || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    return origins.length > 0 ? origins : [...DEFAULT_CORS_ORIGINS];
}

export const config: Config = {
    port: process.env.PORT || '4200',
    supportedDevicesNum: 96,
    supportedSensorsNum: 2,
    JwtSecret: getEnvVariable('JWT_SECRET_KEY'),
    databaseUrl: getEnvVariable('MONGODB_URI'),
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN)
};
