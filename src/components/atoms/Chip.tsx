import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, type AppTheme, type ThemeColors } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export type ChipTone = 'active' | 'paused' | 'critical';

const ICON_BY_TONE = { active: 'play-circle', paused: 'pause-circle', critical: 'flag' } as const;

const toneColors = (colors: ThemeColors, tone: ChipTone) => {
  switch (tone) {
    case 'active':
      return { background: colors.primaryTint, foreground: colors.primary };
    case 'paused':
      return { background: colors.neutralSurface, foreground: colors.textMuted };
    case 'critical':
      return { background: colors.criticalBg, foreground: colors.criticalText };
  }
};

interface ChipProps {
  tone: ChipTone;
  label: string;
}

/** Chip de estado. Ícono + texto: el estado nunca se comunica solo con color. */
export function Chip({ tone, label }: ChipProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { background, foreground } = toneColors(colors, tone);

  return (
    <View style={[styles.chip, { backgroundColor: background }]} accessible accessibilityLabel={label}>
      <Ionicons name={ICON_BY_TONE[tone]} size={iconSizes.sm} color={foreground} />
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </View>
  );
}

const createStyles = ({ radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      height: sizes.badgeHeight,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
    },
    label: {
      ...typography.caption,
    },
  });
