import NetInfo from '@react-native-community/netinfo';

// configure() descarta los listeners existentes: este módulo debe evaluarse antes de cualquier
// NetInfo.addEventListener. Por eso lo importan primero useNetworkStatus y el lector de Wi-Fi.
// iOS solo intenta leer el SSID con esta bandera (y además exige un entitlement de Apple).
NetInfo.configure({ shouldFetchWiFiSSID: true });
