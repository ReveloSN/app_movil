import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface ColorPickerProps<K extends string> {
  accessibilityLabel: string;
  options: readonly { key: K; label: string; color: string }[];
  value: K;
  onChange(key: K): void;
}

/** Muestras de color de selección única. La elegida lleva check (no solo el color) y su nombre se lee. */
export function ColorPicker<K extends string>({ accessibilityLabel, options, value, onChange }: ColorPickerProps<K>) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <PressableScale
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.key)}
            style={[styles.swatch, { backgroundColor: option.color }, selected && styles.selected]}
          >
            {selected ? <Ionicons name="checkmark" size={iconSizes.md} color={colors.card} /> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    swatch: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selected: {
      borderWidth: 3,
      borderColor: colors.textPrimary,
    },
  });
