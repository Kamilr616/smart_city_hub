/* eslint-env jest */
const {createRequire} = require('node:module');

const owners = [
  'jest-config',
  '@react-native-community/cli',
  '@react-native-community/cli-config',
  '@react-native-community/cli-doctor',
];

describe.each(owners)('deep merge used by %s', owner => {
  const merge = createRequire(require.resolve(`${owner}/package.json`))(
    'deepmerge',
  );

  it('does not poison the result or Object.prototype with untrusted keys', () => {
    const proto = JSON.parse('{"__proto__":{"polluted":true}}');
    const constructor = JSON.parse(
      '{"constructor":{"prototype":{"polluted":true}},"prototype":{"polluted":true}}',
    );
    const results = [
      merge(proto, {}),
      merge(Object.create(null), proto),
      merge({nested: null}, {nested: proto}).nested,
      merge({}, constructor),
    ];
    for (const result of results) {
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(result.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    }
  });

  it('keeps the merge contract needed by its consumers', () => {
    expect(merge({a: {x: 1}, list: [1]}, {a: {y: 2}, list: [2]})).toEqual({
      a: {x: 1, y: 2},
      list: [1, 2],
    });
    expect(merge.all([{a: 1}, {b: 2}])).toEqual({a: 1, b: 2});
    expect(merge({list: [1]}, {list: [2]}, {arrayMerge: (_a, b) => b})).toEqual(
      {
        list: [2],
      },
    );
  });
});
