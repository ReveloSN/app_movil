import type { Session } from '@supabase/supabase-js';

export interface Credentials {
  email: string;
  password: string;
}

/** Resultado de una operación de autenticación: `error` es un mensaje listo para mostrar. */
export interface AuthResult {
  error: string | null;
}

export interface SignUpResult extends AuthResult {
  /** true si Supabase exige confirmar el correo antes de iniciar sesión. */
  needsEmailConfirmation: boolean;
}

export interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn(credentials: Credentials): Promise<AuthResult>;
  signUp(credentials: Credentials): Promise<SignUpResult>;
  signOut(): Promise<AuthResult>;
}
