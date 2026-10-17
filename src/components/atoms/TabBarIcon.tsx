import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type ColorValue } from 'react-native';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface TabBarIconProps {
  /** Ícono de la pestaña; activa usa la variante llena. */
  icon: IoniconName;
  activeIcon: IoniconName;
  focused: boolean;
  color: ColorValue;
  size: number;
}

/** Ícono de pestaña: la activa lleva una píldora teñida y el ícono lleno (no solo cambia el color). */
export function TabBarIcon({ icon, activeIcon, focused, color, size }: TabBarIconProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Ionicons name={focused ? activeIcon : icon} size={size} color={color} />
    </View>
  );
}

const createStyles = ({ colors, radii, spacing }: AppTheme) =>
  StyleSheet.create({
    pill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 2,
      borderRadius: radii.full,
    },
    pillActive: {
      backgroundColor: colors.primaryTint,
    },
  });
