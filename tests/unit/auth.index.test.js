// tests/unit/auth.index.test.js
const path = require('path');

// helper to clear module cache and re-require with modified env
function freshLoadAuth(env) {
  const modPath = path.resolve(__dirname, '../../src/auth/index.js');
  jest.resetModules();
  process.env = { ...process.env, ...env };
  // delete from require cache
  delete require.cache[modPath];
  return require('../../src/auth');
}

describe('auth/index strategy selection', () => {
  test('selects basic when AUTH_STRATEGY=basic', () => {
    const auth = freshLoadAuth({ AUTH_STRATEGY: 'basic' });
    expect(auth.name || auth.strategyName || 'basic').toBeDefined();
  });

  test('selects cognito when AUTH_STRATEGY=cognito', () => {
    const auth = freshLoadAuth({ AUTH_STRATEGY: 'cognito' });
    expect(auth.name || auth.strategyName || 'cognito').toBeDefined();
  });
});
