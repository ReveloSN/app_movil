import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Contrato de almacenamiento que espera supabase-js para persistir la sesión. */
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const secureStoreAdapter: SessionStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// expo-secure-store no está disponible en web; ahí se usa AsyncStorage (localStorage).
export const sessionStorage: SessionStorage =
  Platform.OS === 'web' ? AsyncStorage : secureStoreAdapter;
