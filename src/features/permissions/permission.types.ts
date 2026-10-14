/** Permisos que pide la app (P02 se reutiliza para ambos). */
export type PermissionKind = 'notifications' | 'location';

export interface PermissionState {
  granted: boolean;
  /** false = denegado de forma permanente: solo se puede activar desde los ajustes del sistema. */
  canAskAgain: boolean;
}

export const isPermissionKind = (value: unknown): value is PermissionKind =>
  value === 'notifications' || value === 'location';
