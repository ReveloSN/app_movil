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

/** La píldora sobresale del ícono a cada lado y por arriba y abajo. */
export const PILL_INSET = { x: 16, y: 4 } as const;

/**
 * Ícono de pestaña: la activa lleva una píldora teñida y el ícono lleno (no solo cambia el color).
 *
 * La barra de pestañas da al ícono una celda fija del tamaño del ícono (24×24). La píldora va detrás y
 * en posición absoluta, sin padding en el contenedor del ícono: con padding, el ícono se quedaba sin
 * ancho (24 − 2×16 < 0) y desaparecía, dejando solo la píldora vacía.
 */
export function TabBarIcon({ icon, activeIcon, focused, color, size }: TabBarIconProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View testID="tab-icon-cell" style={[styles.cell, { width: size, height: size }]}>
      {focused ? (
        <View
          testID="tab-icon-pill"
          style={[
            styles.pill,
            {
              left: -PILL_INSET.x,
              right: -PILL_INSET.x,
              top: -PILL_INSET.y,
              bottom: -PILL_INSET.y,
              borderRadius: size,
            },
          ]}
        />
      ) : null}
      <Ionicons testID="tab-icon" name={focused ? activeIcon : icon} size={size} color={color} />
    </View>
  );
}

const createStyles = ({ colors }: AppTheme) =>
  StyleSheet.create({
    cell: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pill: {
      position: 'absolute',
      backgroundColor: colors.primaryTint,
    },
  });
