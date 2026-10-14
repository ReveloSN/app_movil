/** Subconjunto de AsyncStorage que usa la app; permite inyectar un almacenamiento falso en tests. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
