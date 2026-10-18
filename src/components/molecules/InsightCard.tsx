import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

interface InsightCardProps {
  icon: IoniconName;
  message: string;
  acceptLabel: string;
  dismissLabel: string;
  onAccept(): void;
  onDismiss(): void;
  busy?: boolean;
  error?: string | null;
}

/** Sugerencia breve con una acción (primaria) y "Ahora no" (terciaria). Ícono + texto, se anuncia sola. */
export function InsightCard({ icon, message, acceptLabel, dismissLabel, onAccept, onDismiss, busy = false, error }: InsightCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Animated.View entering={fadeIn} style={styles.card}>
      <View style={styles.row} accessibilityLiveRegion="polite">
        <Ionicons name={icon} size={iconSizes.md} color={colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
        <Text style={styles.message}>{message}</Text>
      </View>
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <View style={styles.actions}>
        <View style={styles.primary}>
          <PrimaryButton label={acceptLabel} onPress={onAccept} loading={busy} />
        </View>
        <TextButton label={dismissLabel} onPress={onDismiss} disabled={busy} />
      </View>
    </Animated.View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.accentSurface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    message: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    primary: {
      flexGrow: 1,
    },
  });
