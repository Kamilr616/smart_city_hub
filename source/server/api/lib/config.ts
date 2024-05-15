export const config = {
    port: process.env.PORT || 4200,
    supportedDevicesNum: 17,
    JwtSecret: 'secret',
    databaseUrl: process.env.MONGODB_URI || 'mongodb+srv://twwai:KTp5wYwutrLHPLT@cluster0.ooees.mongodb.net/IoT?retryWrites=true&w=majority'
};

