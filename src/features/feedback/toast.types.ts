import type { ToastTone } from '@/components/molecules/Toast';

export type { ToastTone };

export interface ToastAction {
  /** Ej. "Deshacer". */
  label: string;
  onPress(): void;
}

export interface ToastOptions {
  message: string;
  /** success por defecto: casi todos los avisos confirman algo hecho. */
  tone?: ToastTone;
  action?: ToastAction;
}

export interface ToastContextValue {
  /** Muestra un aviso breve; si ya había uno, lo reemplaza. */
  show(toast: string | ToastOptions): void;
  hide(): void;
}
