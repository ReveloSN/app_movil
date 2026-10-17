import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface FilterChipsProps {
  /** Nombre del filtro (ej. "Rutina"); también lo lee el lector de pantalla. */
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange(value: string): void;
}

/** Fila desplazable de chips de selección única. El elegido lleva check, no solo color. */
export function FilterChips({ label, options, value, onChange }: FilterChipsProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
            >
              {selected ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.primary} /> : null}
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: {
      gap: spacing.xs,
    },
    label: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    row: {
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: sizes.secondaryRowHeight,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      backgroundColor: colors.card,
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryTint,
    },
    pressed: {
      opacity: 0.7,
    },
    chipLabel: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
    chipLabelSelected: {
      color: colors.primary,
    },
  });
