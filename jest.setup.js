// Módulos nativos que Jest no tiene: se usan sus simulaciones oficiales.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Los íconos cargan fuentes con expo-asset (no instalado como dependencia directa): en los tests se
// dibujan como un Text vacío con el mismo mapa de glifos.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = require('react-native');
  const Ionicons = (props) => require('react').createElement(Text, props);
  Ionicons.glyphMap = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return { __esModule: true, default: Ionicons };
});
