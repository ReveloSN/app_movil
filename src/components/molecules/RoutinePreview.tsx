import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface RoutinePreviewProps {
  title: string;
  name: string;
  icon: IoniconName;
  accentColor: string;
  accentTint: string;
  /** Ej. "4 ítems". */
  countLabel: string;
  items: readonly { label: string; critical: boolean }[];
  criticalLabel: string;
}

/** Vista previa de una rutina antes de añadirla (ícono con su color, nombre e ítems; críticos con bandera). */
export function RoutinePreview({ title, name, icon, accentColor, accentTint, countLabel, items, criticalLabel }: RoutinePreviewProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: accentTint }]}>
          <Ionicons name={icon} size={iconSizes.lg} color={accentColor} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.name} accessibilityRole="header">
            {name}
          </Text>
          <Text style={styles.secondary}>{countLabel}</Text>
        </View>
      </View>
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={styles.row} accessible accessibilityLabel={item.critical ? `${item.label}, ${criticalLabel}` : item.label}>
          <Ionicons name="ellipse-outline" size={iconSizes.sm} color={colors.textMuted} />
          <Text style={styles.item}>{item.label}</Text>
          {item.critical ? <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} /> : null}
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      borderLeftWidth: spacing.xs,
      backgroundColor: colors.card,
    },
    title: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    secondary: {
      ...typography.label,
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    item: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
  });
