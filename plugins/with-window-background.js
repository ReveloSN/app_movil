// Config plugin: el fondo de la ventana de Android (lo que se ve entre la splash y el primer cuadro de React)
// usa el mismo color que la splash (claro de día, oscuro de noche). Sin esto se veía un destello blanco.
const { withAndroidStyles } = require('expo/config-plugins');

const WINDOW_BACKGROUND = 'android:windowBackground';

module.exports = function withWindowBackground(config) {
  return withAndroidStyles(config, (mod) => {
    const styles = mod.modResults.resources.style ?? [];
    const appTheme = styles.find((style) => style.$.name === 'AppTheme');
    if (appTheme) {
      const items = (appTheme.item ?? []).filter((item) => item.$.name !== WINDOW_BACKGROUND);
      items.push({ $: { name: WINDOW_BACKGROUND }, _: '@color/splashscreen_background' });
      appTheme.item = items;
    }
    return mod;
  });
};
