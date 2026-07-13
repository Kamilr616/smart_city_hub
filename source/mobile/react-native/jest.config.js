module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-reanimated|react-native-chart-kit|react-native-vector-icons)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
