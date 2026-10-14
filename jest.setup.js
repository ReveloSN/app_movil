// Módulos nativos que Jest no tiene: se usan sus simulaciones oficiales.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
