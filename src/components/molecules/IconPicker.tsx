import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface IconPickerProps {
  /** Nombre del grupo para lector de pantalla (ej. "Ícono de la rutina"). */
  accessibilityLabel: string;
  options: readonly { icon: IoniconName; label: string }[];
  value: IoniconName | null;
  onChange(icon: IoniconName): void;
  /** Color del ícono elegido (ej. el de la rutina). */
  accentColor?: string;
}

/** Cuadrícula de íconos de selección única. El elegido lleva borde grueso y fondo, no solo color. */
export function IconPicker({ accessibilityLabel, options, value, onChange, accentColor }: IconPickerProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const accent = accentColor ?? colors.primary;

  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.icon === value;
        return (
          <Pressable
            key={option.icon}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.icon)}
            style={({ pressed }) => [
              styles.cell,
              selected && [styles.selected, { borderColor: accent }],
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={option.icon} size={iconSizes.lg} color={selected ? accent : colors.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing }: AppTheme) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    cell: {
      width: sizes.secondaryRowHeight + spacing.xs,
      height: sizes.secondaryRowHeight + spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.card,
    },
    selected: {
      borderWidth: 3,
      backgroundColor: colors.neutralSurface,
    },
    pressed: {
      opacity: 0.7,
    },
  });
