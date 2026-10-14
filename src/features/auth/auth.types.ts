export interface Credentials {
  email: string;
  password: string;
}

/** Quién usa la app. Existe también sin conexión, aunque la sesión de Supabase no se haya podido renovar. */
export interface AuthUser {
  id: string;
  /** null para un invitado (cuenta anónima). */
  email: string | null;
  isAnonymous: boolean;
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
  user: AuthUser | null;
  loading: boolean;
  signIn(credentials: Credentials): Promise<AuthResult>;
  signUp(credentials: Credentials): Promise<SignUpResult>;
  /** Entra sin cuenta (usuario anónimo de Supabase). Necesita internet solo la primera vez. */
  signInAsGuest(): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
}
