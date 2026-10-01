import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Nombre del grupo para lectores de pantalla (ej. "Tipo de ítem"). */
  accessibilityLabel: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange(value: T): void;
}

/** Selección única entre pocas opciones. La opción elegida lleva check, no solo color. */
export function SegmentedControl<T extends string>({ accessibilityLabel, options, value, onChange }: SegmentedControlProps<T>) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            {selected ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onPrimary} /> : null}
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radii.lg,
      backgroundColor: colors.neutralSurface,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: sizes.secondaryRowHeight,
      borderRadius: radii.md,
    },
    segmentSelected: {
      backgroundColor: colors.primary,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
    labelSelected: {
      color: colors.onPrimary,
    },
  });
