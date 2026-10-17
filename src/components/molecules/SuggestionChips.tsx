import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SuggestionChipsProps {
  labels: readonly string[];
  onPick(index: number): void;
  /** Lectura de cada chip para lector de pantalla (ej. "Añadir Llaves"). */
  accessibilityLabelFor(label: string): string;
}

/** Fila de chips tocables con "+" y texto. Solo props: quien la usa decide qué hace cada uno. */
export function SuggestionChips({ labels, onPick, accessibilityLabelFor }: SuggestionChipsProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabelFor(label)}
          onPress={() => onPick(index)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={iconSizes.sm} color={colors.primary} />
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
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
    pressed: {
      backgroundColor: colors.primaryTint,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textPrimary,
    },
  });
