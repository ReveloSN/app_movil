import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface TemplateCardProps {
  name: string;
  description: string;
  icon: IoniconName;
  /** Texto ya formateado (ej. "6 ítems"). */
  itemCountLabel: string;
  /** Texto informativo del aviso sugerido; sin él no se muestra. */
  triggerLabel?: string;
  actionLabel: string;
  onAction(): void;
}

/** Tarjeta de plantilla (P10): ícono, nombre, cantidad de ítems y acción para usarla. */
export function TemplateCard({
  name,
  description,
  icon,
  itemCountLabel,
  triggerLabel,
  actionLabel,
  onAction,
}: TemplateCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const summary = [name, itemCountLabel, description, triggerLabel].filter(Boolean).join('. ');

  return (
    <View style={styles.card}>
      <View style={styles.summary} accessible accessibilityLabel={`${summary}.`}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.meta}>{itemCountLabel}</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
        {triggerLabel ? (
          <View style={styles.trigger}>
            <Ionicons name="notifications-outline" size={iconSizes.sm} color={colors.textSecondary} />
            <Text style={styles.meta}>{triggerLabel}</Text>
          </View>
        ) : null}
      </View>
      <SecondaryButton icon="copy-outline" label={actionLabel} onPress={onAction} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    summary: {
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconCircle: {
      width: sizes.secondaryRowHeight,
      height: sizes.secondaryRowHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryTint,
    },
    body: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    description: {
      ...typography.body,
      color: colors.textPrimary,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    meta: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
  });
