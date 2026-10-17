import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

export type ToastTone = 'success' | 'info' | 'error';

const ICON_BY_TONE: Record<ToastTone, IoniconName> = {
  success: 'checkmark-circle',
  info: 'information-circle',
  error: 'alert-circle',
};

interface ToastProps {
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?(): void;
}

/** Aviso breve (snackbar): ícono + texto y, si hay, una acción de texto (ej. "Deshacer"). */
export function Toast({ message, tone, actionLabel, onAction }: ToastProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View testID="toast" style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons
        name={ICON_BY_TONE[tone]}
        size={iconSizes.md}
        color={tone === 'error' ? colors.onInverseSurface : colors.inversePrimary}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          hitSlop={8}
          style={styles.action}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.inverseSurface,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    message: {
      ...typography.label,
      color: colors.onInverseSurface,
      flex: 1,
    },
    action: {
      minHeight: sizes.secondaryRowHeight,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    actionLabel: {
      ...typography.labelMedium,
      color: colors.inversePrimary,
    },
  });
