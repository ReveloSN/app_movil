import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';

import * as copy from './unsaved-changes.copy';

interface UnsavedChangesDialogProps {
  visible: boolean;
  onSave(): void;
  onDiscard(): void;
  /** Atrás de Android con el diálogo abierto: lo cierra sin salir. */
  onDismiss(): void;
}

/** DC-03: "Guardar · Descartar". Guardar es la opción segura (botón primario). */
export function UnsavedChangesDialog({ visible, onSave, onDiscard, onDismiss }: UnsavedChangesDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      title={copy.UNSAVED_TITLE}
      message={copy.UNSAVED_MESSAGE}
      cancelLabel={copy.UNSAVED_SAVE}
      onCancel={onSave}
      confirmLabel={copy.UNSAVED_DISCARD}
      onConfirm={onDiscard}
      onDismiss={onDismiss}
    />
  );
}
