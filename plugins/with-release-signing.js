// Config plugin: firma el release con tu keystore (leído de ~/.gradle/gradle.properties).
// Sin keystore configurado, el release queda firmado con la clave de depuración
// (SOLO PRUEBA) y Gradle lo avisa en la consola. Ver docs/RELEASE.md.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// release-signing-plugin';

const RELEASE_SIGNING_BLOCK = `        release {
            ${MARKER}
            if (findProperty('VERIFICADOR_STORE_FILE')) {
                storeFile file(findProperty('VERIFICADOR_STORE_FILE'))
                storePassword findProperty('VERIFICADOR_STORE_PASSWORD')
                keyAlias findProperty('VERIFICADOR_KEY_ALIAS')
                keyPassword findProperty('VERIFICADOR_KEY_PASSWORD')
            }
        }
`;

const RELEASE_SIGNING_CONFIG = `            signingConfig findProperty('VERIFICADOR_STORE_FILE') ? signingConfigs.release : signingConfigs.debug
            if (!findProperty('VERIFICADOR_STORE_FILE')) {
                logger.warn('WARNING: sin keystore (VERIFICADOR_STORE_FILE); el release se firma con la clave de depuración: SOLO PRUEBA.')
            }`;

function patch(contents) {
  if (contents.includes(MARKER)) return contents;

  const debugBlock = /(signingConfigs \{\s*debug \{[\s\S]*?\n        \}\n)/;
  if (!debugBlock.test(contents)) throw new Error('with-release-signing: no se encontró signingConfigs.debug');
  let next = contents.replace(debugBlock, `$1${RELEASE_SIGNING_BLOCK}`);

  const releaseSigning = /(release \{\s*\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/;
  if (!releaseSigning.test(next)) throw new Error('with-release-signing: no se encontró el signingConfig de release');
  next = next.replace(releaseSigning, `$1${RELEASE_SIGNING_CONFIG.trimStart()}`);
  return next;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = patch(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.patch = patch;
