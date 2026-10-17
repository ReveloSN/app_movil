import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressableScale } from '@/components/atoms/PressableScale';
import { staggeredEntering } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SuggestionChipsProps {
  labels: readonly string[];
  onPick(index: number): void;
  /** Lectura de cada chip para lector de pantalla (ej. "Añadir Llaves"). */
  accessibilityLabelFor(label: string): string;
  /** Los chips entran escalonados (ej. sugerencias recién llegadas de la IA). */
  staggerIn?: boolean;
}

/** Fila de chips tocables con "+" y texto. Solo props: quien la usa decide qué hace cada uno. */
export function SuggestionChips({ labels, onPick, accessibilityLabelFor, staggerIn = false }: SuggestionChipsProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <Animated.View key={label} entering={staggerIn ? staggeredEntering(index) : undefined}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabelFor(label)}
            onPress={() => onPick(index)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={iconSizes.sm} color={colors.primary} />
            <Text style={styles.label}>{label}</Text>
          </PressableScale>
        </Animated.View>
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
