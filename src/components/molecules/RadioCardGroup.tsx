import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  icon: IoniconName;
  /** Ícono pequeño superpuesto (ej. flecha de salida sobre el Wi-Fi). */
  badgeIcon?: IoniconName;
}

interface RadioCardGroupProps<T extends string> {
  /** Nombre del grupo para lectores de pantalla (ej. "Tipo de aviso"). */
  accessibilityLabel: string;
  options: readonly RadioCardOption<T>[];
  value: T;
  onChange(value: T): void;
}

/**
 * Selección única como lista vertical de filas a todo el ancho (≥ 56 dp): ícono, texto y un círculo con
 * check a la derecha. La elegida se distingue por borde, fondo y check, nunca solo por color. Crece con el
 * texto grande en vez de recortarlo.
 */
export function RadioCardGroup<T extends string>({ accessibilityLabel, options, value, onChange }: RadioCardGroupProps<T>) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            pressedScale={0.98}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name={option.icon} size={iconSizes.lg} color={selected ? colors.primary : colors.textMuted} />
              {option.badgeIcon ? (
                <View style={styles.badge}>
                  <Ionicons name={option.badgeIcon} size={iconSizes.sm - 4} color={selected ? colors.primary : colors.textMuted} />
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            <View
              style={[styles.indicator, selected && styles.indicatorSelected]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {selected ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onPrimary} /> : null}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const INDICATOR = 22;

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radii.xl,
      backgroundColor: colors.surface,
    },
    rowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryTint,
    },
    icon: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      borderRadius: radii.full,
      padding: 1,
      backgroundColor: colors.card,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    labelSelected: {
      ...typography.bodyStrong,
    },
    indicator: {
      width: INDICATOR,
      height: INDICATOR,
      borderRadius: INDICATOR / 2,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indicatorSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
  });
