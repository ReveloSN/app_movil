import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Skeleton, SkeletonGroup } from '@/components/atoms/Skeleton';
import { AnimatedCounter } from '@/components/molecules/AnimatedCounter';
import { EmptyState } from '@/components/molecules/EmptyState';
import { WeeklyBarChart, type WeeklyBarDatum } from '@/components/molecules/WeeklyBarChart';
import { fadeIn } from '@/shared/theme/motion';
import type { AppTheme } from '@/shared/theme/useAppTheme';
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
  // Sin salidas: la ilustración de rutinas (lista con "+") invita a hacer la primera verificación.
  if (status === 'empty') {
    return <EmptyState inline illustration="noRoutines" title={copy.STATS_EMPTY_TITLE} message={copy.STATS_EMPTY_MESSAGE} />;
  }

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

/** Alturas de las barras del esqueleto semanal (7 días, sin valores reales). */
const WEEK_BAR_HEIGHTS = [48, 72, 40, 96, 60, 84, 36] as const;

/** Esqueleto de Estadísticas: dos tarjetas de racha, una de total y la de barras semanales, con la forma real. */
function StatsLoading() {
  const styles = useThemedStyles(createStyles);
  return (
    <SkeletonGroup accessibilityLabel={copy.STATS_LOADING_LABEL} style={styles.stack}>
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
      <View style={[styles.card, styles.totalCard]}>
        <Skeleton height={14} width="35%" />
        <Skeleton height={28} width="20%" />
      </View>
      <View style={styles.card}>
        <Skeleton height={18} width="40%" />
        <View style={styles.bars}>
          {WEEK_BAR_HEIGHTS.map((height, index) => (
            <View key={index} style={styles.bar}>
              <Skeleton height={height} />
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
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
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      height: 120,
    },
    bar: {
      flex: 1,
    },
  });
