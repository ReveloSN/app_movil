import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Weekday } from '@/shared/types/clock.types';

export interface DayOption {
  value: Weekday;
  /** Letra visible (ej. "L"). */
  short: string;
  /** Nombre completo para lector de pantalla (ej. "lunes"). */
  name: string;
}

interface DayPickerProps {
  /** En el orden en que se muestran. */
  options: readonly DayOption[];
  value: readonly Weekday[];
  onChange(value: Weekday[]): void;
}

/** Selección múltiple de días. El elegido se marca con relleno y subrayado, no solo con color. */
export function DayPicker({ options, value, onChange }: DayPickerProps) {
  const styles = useThemedStyles(createStyles);

  function toggle(day: Weekday) {
    onChange(value.includes(day) ? value.filter((current) => current !== day) : [...value, day]);
  }

  return (
    <View style={styles.row} accessibilityLabel="Días">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="checkbox"
            accessibilityLabel={option.name}
            accessibilityState={{ checked: selected }}
            onPress={() => toggle(option.value)}
            style={[styles.day, selected && styles.daySelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    day: {
      flex: 1,
      minHeight: sizes.secondaryRowHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      backgroundColor: colors.card,
    },
    daySelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
    labelSelected: {
      color: colors.onPrimary,
      textDecorationLine: 'underline',
    },
  });
