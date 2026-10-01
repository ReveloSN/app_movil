import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { sessionStorage } from './sessionStorage';

// Acceso estático obligatorio: Expo solo inyecta EXPO_PUBLIC_* si se leen como process.env.NOMBRE.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. Revisa el archivo .env en la raíz del proyecto.',
  );
}

// supabase-js agrega /rest/v1 y /auth/v1 por su cuenta: la URL debe ser solo el origen.
if (/\/(rest|auth)\/v1/.test(supabaseUrl)) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL debe ser solo https://<proyecto>.supabase.co, sin /rest/v1.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
