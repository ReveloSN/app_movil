const fs = require('fs');
const path = require('path');
const { patch } = require('./with-release-signing');

const template = fs.readFileSync(path.join(__dirname, '__fixtures__', 'build.gradle.txt'), 'utf8');

describe('with-release-signing', () => {
  it('añade el signingConfig release y lo usa solo si hay keystore', () => {
    const out = patch(template);
    expect(out).toContain("findProperty('VERIFICADOR_STORE_FILE')");
    expect(out).toContain('signingConfigs.release : signingConfigs.debug');
  });

  it('es idempotente', () => {
    const once = patch(template);
    expect(patch(once)).toBe(once);
  });

  it('no escribe contraseñas literales para release', () => {
    expect(patch(template)).not.toMatch(/storePassword '(?!android)/);
  });
});
