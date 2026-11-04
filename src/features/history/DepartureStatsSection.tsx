import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Skeleton } from '@/components/atoms/Skeleton';
import { AnimatedCounter } from '@/components/molecules/AnimatedCounter';
import { WeeklyBarChart, type WeeklyBarDatum } from '@/components/molecules/WeeklyBarChart';
import { fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './stats.copy';
import type { CompletionRate, DepartureSummary } from './stats';
import type { DepartureStatsStatus } from './useDepartureStats';

interface DepartureStatsSectionProps {
  status: DepartureStatsStatus;
  summary: DepartureSummary;
}

const percentFormat = (n: number) => copy.percentLabel(Math.round(n));

/** Estadísticas de salidas: rachas, cumplimiento, total y gráfico de la semana. */
export function DepartureStatsSection({ status, summary }: DepartureStatsSectionProps) {
  const styles = useThemedStyles(createStyles);

  if (status === 'loading') return <StatsLoading />;
  if (status === 'empty') return <StatsEmpty />;

  const weekData: WeeklyBarDatum[] = summary.week.map((day) => ({
    key: day.date,
    label: copy.weekdayInitial(day.weekday),
    value: day.completed,
    a11yLabel: copy.dayA11y(day),
    highlighted: day.isToday,
    muted: day.isFuture,
  }));
  const weekCompleted = summary.week.reduce((sum, day) => sum + day.completed, 0);

  return (
    <Animated.View entering={fadeIn} style={styles.stack}>
      <View style={styles.row}>
        <StreakTile title={copy.CURRENT_STREAK_TITLE} days={summary.currentStreak} />
        <StreakTile title={copy.BEST_STREAK_TITLE} days={summary.bestStreak} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          {copy.COMPLETION_TITLE}
        </Text>
        <View style={styles.row}>
          <RateBlock title={copy.RATE_7_TITLE} rate={summary.last7Days} />
          <RateBlock title={copy.RATE_30_TITLE} rate={summary.last30Days} />
        </View>
      </View>

      <View
        style={[styles.card, styles.totalCard]}
        accessible
        accessibilityLabel={copy.totalA11y(summary.totalDepartures)}
      >
        <Text style={styles.cardLabel}>{copy.TOTAL_TITLE}</Text>
        <AnimatedCounter value={summary.totalDepartures} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          {copy.WEEK_TITLE}
        </Text>
        <WeeklyBarChart data={weekData} summaryLabel={copy.weekSummaryLabel(weekCompleted)} />
      </View>
    </Animated.View>
  );
}

function StreakTile({ title, days }: { title: string; days: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, styles.tile]} accessible accessibilityLabel={copy.streakA11y(title, days)}>
      <Text style={styles.cardLabel}>{title}</Text>
      <View style={styles.valueRow}>
        <AnimatedCounter value={days} />
        <Text style={styles.unit}>{copy.daysUnit(days)}</Text>
      </View>
    </View>
  );
}

function RateBlock({ title, rate }: { title: string; rate: CompletionRate }) {
  const styles = useThemedStyles(createStyles);
  const note = copy.partialsNote(rate.partial);
  return (
    <View style={styles.tile} accessible accessibilityLabel={copy.rateA11y(title, rate)}>
      <Text style={styles.cardLabel}>{title}</Text>
      {rate.rate === null ? (
        <Text style={styles.noData}>{copy.NO_DEPARTURES_YET}</Text>
      ) : (
        <AnimatedCounter value={copy.ratePercent(rate.rate)} format={percentFormat} />
      )}
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

function StatsLoading() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stack} accessible accessibilityLabel={copy.STATS_LOADING_LABEL} accessibilityState={{ busy: true }}>
      <View style={styles.row}>
        <View style={[styles.card, styles.tile]}>
          <Skeleton height={14} width="60%" />
          <Skeleton height={34} width="40%" />
        </View>
        <View style={[styles.card, styles.tile]}>
          <Skeleton height={14} width="60%" />
          <Skeleton height={34} width="40%" />
        </View>
      </View>
      <View style={styles.card}>
        <Skeleton height={14} width="40%" />
        <Skeleton height={120} />
      </View>
    </View>
  );
}

function StatsEmpty() {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View entering={fadeIn} style={styles.empty} accessible accessibilityLabel={`${copy.STATS_EMPTY_TITLE}. ${copy.STATS_EMPTY_MESSAGE}`}>
      {/* Hueco simple: las ilustraciones llegan después (F5). */}
      <Ionicons name="stats-chart-outline" size={iconSizes.xl} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>{copy.STATS_EMPTY_TITLE}</Text>
      <Text style={styles.emptyMessage}>{copy.STATS_EMPTY_MESSAGE}</Text>
    </Animated.View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    stack: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    tile: {
      flex: 1,
      gap: spacing.xs,
    },
    totalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    cardLabel: {
      ...typography.label,
      color: colors.textSecondary,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    unit: {
      ...typography.body,
      color: colors.textSecondary,
    },
    noData: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    note: {
      ...typography.label,
      color: colors.textSecondary,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
    },
    emptyTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyMessage: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
