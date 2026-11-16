const path = require('path');

it('maps all app FirebaseConfig imports to one emulator module', () => {
  const original = process.env.SCH_E2E_FIREBASE;
  process.env.SCH_E2E_FIREBASE = '1';
  jest.resetModules();
  try {
    const {resolver} = require('../metro.config');
    const root = path.resolve(__dirname, '..');
    const resolveRequest = (context, moduleName) => ({
      type: 'sourceFile',
      filePath: path.resolve(
        path.dirname(context.originModulePath),
        `${moduleName}.ts`,
      ),
    });
    const cases = [
      [path.join(root, 'App.tsx'), './FirebaseConfig'],
      [path.join(root, 'screens', 'LoginScreen.tsx'), '../FirebaseConfig'],
      [
        path.join(root, 'screens', 'RegistrationScreen.tsx'),
        '../FirebaseConfig',
      ],
      [
        path.join(root, 'screens', 'CustomDrawerContent.tsx'),
        '../FirebaseConfig',
      ],
    ];
    for (const [originModulePath, name] of cases) {
      expect(
        resolver.resolveRequest(
          {originModulePath, resolveRequest},
          name,
          'ios',
        ),
      ).toEqual({
        type: 'sourceFile',
        filePath: path.join(root, 'e2e', 'FirebaseConfig.ts'),
      });
    }
    const otherOrigin = path.join(root, 'other', 'example.ts');
    expect(
      resolver.resolveRequest(
        {originModulePath: otherOrigin, resolveRequest},
        './FirebaseConfig',
        'ios',
      ),
    ).toEqual({
      type: 'sourceFile',
      filePath: path.join(root, 'other', 'FirebaseConfig.ts'),
    });
  } finally {
    if (original === undefined) {
      delete process.env.SCH_E2E_FIREBASE;
    } else {
      process.env.SCH_E2E_FIREBASE = original;
    }
    jest.resetModules();
  }
});
