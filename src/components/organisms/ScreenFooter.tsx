import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useBottomInset } from '@/shared/hooks/useBottomInset';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ScreenFooterProps {
  children: ReactNode;
  /** Pie sobre una superficie con borde superior (formularios y hojas); sin él, se funde con el fondo. */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pie fijo de pantallas y hojas inferiores (zona del pulgar). Suma el alto de la barra de navegación
 * del sistema para que sus botones nunca queden tapados; con el teclado abierto no la suma.
 */
export function ScreenFooter({ children, bordered = false, style }: ScreenFooterProps) {
  const styles = useThemedStyles(createStyles);
  const bottomInset = useBottomInset();

  return (
    <View
      testID="screen-footer"
      style={[styles.footer, bordered && styles.bordered, { paddingBottom: styles.footer.paddingTop + bottomInset }, style]}
    >
      {children}
    </View>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    footer: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    bordered: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  });
