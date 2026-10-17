import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { COMPLETE_MESSAGE, CRITICAL_LABEL, partialMessage, streakLabel } from '@/features/checklist/checklist.copy';
import { fromSummaryParams, type SummaryParams } from '@/features/checklist/summaryParams';
import { useRoutineStreak } from '@/features/history/useRoutineStreak';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDuration } from '@/shared/utils/formatDuration';

// Texto del botón: el brief pide "volver a /(tabs)" sin microcopy definido.
const BACK_LABEL = 'Volver a mis rutinas';

export default function SummaryScreen() {
  const params = useLocalSearchParams<Partial<SummaryParams>>();
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const summary = fromSummaryParams(params);
  const streak = useRoutineStreak(params.id ?? '');
  const complete = summary.outcome === 'completed';
  const message = complete ? COMPLETE_MESSAGE : partialMessage(summary.checked, summary.total, summary.omittedLabels);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, complete ? styles.badgeComplete : styles.badgePartial]}>
          <Ionicons
            name={complete ? 'checkmark' : 'alert'}
            size={iconSizes.xl}
            color={complete ? colors.primary : colors.criticalText}
          />
        </View>

        {/* CF-01 / CF-02 */}
        <Text style={styles.message} accessibilityRole="header">
          {message}
        </Text>

        {summary.omittedLabels.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Omitidos</Text>
            {summary.omittedLabels.map((label, index) => {
              const critical = summary.omittedCriticalLabels.includes(label);
              return (
                <View
                  key={`${label}-${index}`}
                  style={styles.omittedRow}
                  accessible
                  accessibilityLabel={critical ? `${label}, ${CRITICAL_LABEL}` : label}
                >
                  <Ionicons name="close-circle-outline" size={iconSizes.md} color={colors.textMuted} />
                  <Text style={styles.omittedLabel}>{label}</Text>
                  {critical ? (
                    <View style={styles.critical}>
                      <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} />
                      <Text style={styles.criticalText}>{CRITICAL_LABEL}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Duración</Text>
          <Text style={styles.duration}>{formatDuration(summary.durationSeconds)}</Text>
        </View>

        {/* 08-4: solo con 2 días o más; sin mensaje cuando se pierde. */}
        {streak ? (
          <View style={[styles.card, styles.streak]} accessible accessibilityLabel={streakLabel(streak)}>
            <Ionicons name="flame-outline" size={iconSizes.md} color={colors.primary} />
            <Text style={styles.duration}>{streakLabel(streak)}</Text>
          </View>
        ) : null}
      </ScrollView>

      <ScreenFooter>
        <PrimaryButton label={BACK_LABEL} onPress={() => router.dismissTo('/(tabs)')} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: spacing.xl,
      padding: spacing.xl,
    },
    badge: {
      alignSelf: 'center',
      width: sizes.largeIconCircle,
      height: sizes.largeIconCircle,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeComplete: {
      backgroundColor: colors.primaryTint,
    },
    badgePartial: {
      backgroundColor: colors.criticalBg,
    },
    message: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    cardTitle: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    omittedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    omittedLabel: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    critical: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
      backgroundColor: colors.criticalBg,
    },
    criticalText: {
      ...typography.caption,
      color: colors.criticalText,
    },
    streak: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    duration: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
  });
