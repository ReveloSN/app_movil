import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface SwitchRowProps {
  label: string;
  value: boolean;
  onValueChange(value: boolean): void;
  icon?: ComponentProps<typeof Ionicons>['name'];
}

export function SwitchRow({ label, value, onValueChange, icon }: SwitchRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={iconSizes.md} color={colors.textMuted} /> : null}
      <Text style={styles.label}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.card}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.secondaryRowHeight,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
  });
