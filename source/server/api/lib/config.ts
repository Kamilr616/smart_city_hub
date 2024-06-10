export const config = {
    port: process.env.PORT || 4200,
    supportedDevicesNum: 96,
    supportedSensorsNum: 2,
    JwtSecret: '306eef4738adbaa1a5e3cd7fd5e35025e52cb068e43964bd93c3a667c53714c4e23b6bdd59c6461f3beb1d28f4059e0793f8ba8e0e4edda2c76743e9760ad97f7e259cfba1efb0b2b66209f02ce005c38e272cb67b924c29ade23365e3a6cdd2d570fd4cfc4f90e61794398b48a63c46fff649d048cdabb9c8a8cec30d9e8b6538fef8c9a94edb57292b9f9ab3aa4c9b354d62e8569c6de74175e2785fe78606f834977778540283fa71c497653e444f85cdd1a0a1aa24f0d06d4d941ef91e279b00a6c542ee92f6f69b85593c2763caf8dd42226abc1e688a8f356825bed01aab4ba6edafd244253ec2f9727a87d9ec52a8aef92cf4ffc8c5502e140eb25e59', //secret
    databaseUrl: process.env.MONGODB_URI || 'mongodb+srv://mmati28:kamien123@cluster0.cundrnm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
};

