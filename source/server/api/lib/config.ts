export const config = {
    port: process.env.PORT || 4200,
    supportedDevicesNum: 16,
    supportedSensorsNum: 4,
    JwtSecret: 'secret',
    databaseUrl: process.env.MONGODB_URI || 'REDACTED'
};

