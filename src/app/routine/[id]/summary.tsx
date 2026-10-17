import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountUp } from '@/components/atoms/CountUp';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { COMPLETE_MESSAGE, CRITICAL_LABEL, partialMessage, STREAK_SUFFIX, streakLabel } from '@/features/checklist/checklist.copy';
import { fromSummaryParams, type SummaryParams } from '@/features/checklist/summaryParams';
import { useRoutineStreak } from '@/features/history/useRoutineStreak';
import { durations, springs } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDuration } from '@/shared/utils/formatDuration';

// Confirmación (CF-01): el check entra con un resorte suave y el texto lo sigue. Parcial (CF-02): solo un
// fundido, sin celebración. El resto entra justo después; el botón está activo desde el principio.
const reduce = ReduceMotion.System;
const completeBadge = ZoomIn.springify().damping(springs.gentle.damping).stiffness(springs.gentle.stiffness).reduceMotion(reduce);
const neutralBadge = FadeIn.duration(durations.base).reduceMotion(reduce);
const messageEntering = FadeInDown.duration(durations.base).delay(80).reduceMotion(reduce);
const detailsEntering = FadeIn.duration(durations.base).delay(160).reduceMotion(reduce);

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
        <Animated.View
          entering={complete ? completeBadge : neutralBadge}
          style={[styles.badge, complete ? styles.badgeComplete : styles.badgePartial]}
        >
          <Ionicons
            name={complete ? 'checkmark' : 'alert'}
            size={iconSizes.xl}
            color={complete ? colors.primary : colors.criticalText}
          />
        </Animated.View>

        {/* CF-01 / CF-02 */}
        <Animated.Text entering={messageEntering} style={styles.message} accessibilityRole="header">
          {message}
        </Animated.Text>

        <Animated.View entering={detailsEntering} style={styles.details}>
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
              {/* El número cuenta hasta la racha; el lector oye la frase completa (etiqueta de la tarjeta). */}
              <CountUp value={streak} style={styles.duration} />
              <Text style={styles.duration}>{STREAK_SUFFIX}</Text>
            </View>
          ) : null}
        </Animated.View>
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
    details: {
      gap: spacing.xl,
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
