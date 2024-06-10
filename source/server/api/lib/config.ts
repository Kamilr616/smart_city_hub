export const config = {
    port: process.env.PORT || 4200,
    supportedDevicesNum: 96,
    supportedSensorsNum: 2,
    JwtSecret: 'REDACTED', //secret
    databaseUrl: process.env.MONGODB_URI || 'REDACTED'
};

