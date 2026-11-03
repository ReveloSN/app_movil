import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface FloatingActionButtonProps {
  /** Lo que hace, para lector de pantalla (el botón solo lleva ícono). */
  accessibilityLabel: string;
  onPress(): void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Posición (la pantalla lo ancla donde convenga). */
  containerStyle?: StyleProp<ViewStyle>;
}

/** Botón circular de la acción principal de una pantalla ("+" por defecto). 56 dp, de color primario. */
export function FloatingActionButton({ accessibilityLabel, onPress, icon = 'add', containerStyle }: FloatingActionButtonProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      containerStyle={containerStyle}
      style={styles.button}
    >
      <Ionicons name={icon} size={iconSizes.lg + 4} color={colors.onPrimary} />
    </PressableScale>
  );
}

const createStyles = ({ colors, radii, sizes }: AppTheme) =>
  StyleSheet.create({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      width: sizes.fabSize,
      height: sizes.fabSize,
      borderRadius: radii.full,
      backgroundColor: colors.primary,
      elevation: 4,
    },
  });
