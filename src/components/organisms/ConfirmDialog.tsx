import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ConfirmDialogProps {
  visible: boolean;
  /** Pregunta corta arriba del mensaje (opcional). */
  title?: string;
  message: string;
  /** Acción que confirma (ej. "Omitir", "Salir"). */
  confirmLabel: string;
  /** Acción que vuelve atrás sin cambios (ej. "Revisar", "Seguir"). Es la opción destacada. */
  cancelLabel: string;
  onConfirm(): void;
  onCancel(): void;
  /** Muestra la acción que confirma primero (ej. DC-01: "Eliminar · Cancelar"). */
  confirmFirst?: boolean;
  /** Atrás de Android con el diálogo abierto. Por defecto, igual que `onCancel`. */
  onDismiss?(): void;
}

/**
 * Diálogo de confirmación (patrón DC-xx). La opción segura (cancelar) es el botón primario:
 * con prisa, el toque "por defecto" no debe perder trabajo.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmFirst = false,
  onDismiss,
}: ConfirmDialogProps) {
  const styles = useThemedStyles(createStyles);
  const confirm = <SecondaryButton label={confirmLabel} onPress={onConfirm} />;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss ?? onCancel} statusBarTranslucent>
      <View style={styles.scrim}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.texts}>
            {title ? (
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            <Text style={title ? styles.body : styles.message} accessibilityRole="alert">
              {message}
            </Text>
          </View>
          {/* El orden sigue al documento (y al lector de pantalla); la opción segura siempre es el botón primario. */}
          <View style={styles.actions}>
            {confirmFirst ? confirm : null}
            <PrimaryButton label={cancelLabel} onPress={onCancel} />
            {confirmFirst ? null : confirm}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.scrim,
    },
    dialog: {
      gap: spacing.xl,
      padding: spacing.xl,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    texts: {
      gap: spacing.sm,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    message: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
    actions: {
      gap: spacing.md,
    },
  });
