import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Obligatorio: es lo único que anuncia el lector de pantalla. */
  accessibilityLabel: string;
  onPress(): void;
  tone?: 'default' | 'danger';
}

export function IconButton({ icon, accessibilityLabel, onPress, tone = 'default' }: IconButtonProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={iconSizes.lg} color={tone === 'danger' ? colors.danger : colors.textMuted} />
    </PressableScale>
  );
}

const createStyles = ({ colors, radii, sizes }: AppTheme) =>
  StyleSheet.create({
    button: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: colors.neutralSurface,
    },
  });
