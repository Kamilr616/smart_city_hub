const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config =
  process.env.SCH_E2E_FIREBASE === '1'
    ? {
        resolver: {
          resolveRequest(context, moduleName, platform) {
            if (moduleName === '../FirebaseConfig') {
              return {
                type: 'sourceFile',
                filePath: path.join(__dirname, 'e2e', 'FirebaseConfig.ts'),
              };
            }
            return context.resolveRequest(context, moduleName, platform);
          },
        },
      }
    : {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
