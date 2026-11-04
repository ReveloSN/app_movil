import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { FilterChips } from '@/components/molecules/FilterChips';
import { HistoryRecordRow } from '@/components/molecules/HistoryRecordRow';
import { SegmentedControl, type SegmentOption } from '@/components/molecules/SegmentedControl';
import { DepartureStatsSection } from '@/features/history/DepartureStatsSection';
import * as copy from '@/features/history/history.copy';
import { formatDayHeading } from '@/features/history/history.dates';
import { filterRecords, mostSkippedItems, NO_FILTER, type HistoryFilter } from '@/features/history/history.filter';
import { groupRecordsByDay } from '@/features/history/history.grouping';
import { HistorySkeleton } from '@/features/history/HistorySkeleton';
import { describeResult, RESULT_FILTERS } from '@/features/history/history.result';
import type { HistoryEntry } from '@/features/history/history.types';
import { RecordDetailSheet } from '@/features/history/RecordDetailSheet';
import * as statsCopy from '@/features/history/stats.copy';
import { useDepartureStats } from '@/features/history/useDepartureStats';
import { useHistory } from '@/features/history/useHistory';
import { WeekSummarySection } from '@/features/insights/WeekSummarySection';
import { useTabSwipeLockHandlers } from '@/features/navigation/TabSwipeLock';
import { routineAccent } from '@/features/routines/routine-appearance';
import { useRoutines } from '@/features/routines/useRoutines';
import { PENDING_SYNC_LABEL } from '@/features/sync/sync.copy';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const ALL = '';

// EV-02 → Inicio: desde el vacío se vuelve a la pestaña para registrar una verificación.
const goHome = () => router.navigate('/(tabs)');

type HistoryView = 'history' | 'stats';
const VIEW_OPTIONS: readonly SegmentOption<HistoryView>[] = [
  { value: 'history', label: statsCopy.VIEW_HISTORY_LABEL },
  { value: 'stats', label: statsCopy.VIEW_STATS_LABEL },
];

export default function HistoryScreen() {
  const history = useHistory();
  const { records, loading, error, refresh } = history;
  const stats = useDepartureStats(history);
  // Historial | Estadísticas: no se guarda; al volver a la pestaña se ve el listado.
  const [view, setView] = useState<HistoryView>('history');
  const { routines } = useRoutines();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const swipeLock = useTabSwipeLockHandlers();
  // Fecha de "Tu semana" en cada render (las estadísticas son baratas; la clave de la semana cambia el lunes).
  const weekNow = new Date();
  // 09-3: vive en la pestaña; no se guarda.
  const [filter, setFilter] = useState<HistoryFilter>(NO_FILTER);
  const [detail, setDetail] = useState<HistoryEntry | null>(null);

  // La pestaña queda montada: al volver a ella se pide sincronizar (trae lo de otros dispositivos).
  // El primer foco se salta porque useHistory ya hace la carga inicial.
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) void refresh();
      focusedBefore.current = true;
    }, [refresh]),
  );

  const filtered = useMemo(() => filterRecords(records, filter), [records, filter]);
  const sections = useMemo(
    () =>
      groupRecordsByDay(filtered, routines).map((group) => ({
        key: group.date,
        title: formatDayHeading(group.date),
        data: group.records,
      })),
    [filtered, routines],
  );
  const skipped = useMemo(() => mostSkippedItems(filtered), [filtered]);

  const routineOptions = useMemo(
    () => [{ value: ALL, label: copy.ALL_ROUTINES_LABEL }, ...routines.map((routine) => ({ value: routine.id, label: routine.name }))],
    [routines],
  );
  const resultOptions = useMemo(() => [{ value: ALL, label: copy.ALL_RESULTS_LABEL }, ...RESULT_FILTERS], []);

  // Primera carga y error sin datos ocupan toda la pantalla; con datos, se mantiene la lista.
  if (loading && records.length === 0) return <HistorySkeleton loading={loading} />;
  if (error && records.length === 0) return <ErrorState message={error} onRetry={refresh} />;
  if (records.length === 0) {
    return (
      <EmptyState
        illustration="noResults"
        title={copy.EMPTY_TITLE}
        message={copy.EMPTY_MESSAGE}
        action={{ label: copy.EMPTY_ACTION, onPress: goHome, accessibilityHint: copy.EMPTY_ACTION_HINT }}
      />
    );
  }

  const viewSwitch = (
    <SegmentedControl<HistoryView> accessibilityLabel={statsCopy.VIEW_GROUP_LABEL} options={VIEW_OPTIONS} value={view} onChange={setView} />
  );

  if (view === 'stats') {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.list, styles.statsContent]}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {viewSwitch}
          <DepartureStatsSection status={stats.status} summary={stats.summary} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(record) => record.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.filters}>
            {viewSwitch}
            {/* "Tu semana": resumen guardado por semana (se genera a pedido). */}
            <WeekSummarySection records={records} now={weekNow} />
            {error ? <StatusMessage tone="error" message={error} /> : null}
            {/* Los filtros se desplazan en horizontal: mientras se tocan, no se cambia de pestaña deslizando. */}
            <View style={styles.filters} {...swipeLock}>
              <FilterChips
                label={copy.FILTER_ROUTINE_LABEL}
                options={routineOptions}
                value={filter.routineId ?? ALL}
                onChange={(value) => setFilter((current) => ({ ...current, routineId: value || null }))}
              />
              <FilterChips
                label={copy.FILTER_RESULT_LABEL}
                options={resultOptions}
                value={filter.result ?? ALL}
                onChange={(value) => setFilter((current) => ({ ...current, result: value || null }))}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.secondary}>{copy.FILTER_EMPTY_MESSAGE}</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={styles.heading} accessibilityRole="header">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <HistoryRecordRow
            routineName={item.routineName}
            routineIcon={item.routineIcon}
            accentColor={routineAccent(colors, item.routineColor).color}
            accentTint={routineAccent(colors, item.routineColor).tint}
            date={item.date}
            result={describeResult(item.result)}
            pendingLabel={item.pending ? PENDING_SYNC_LABEL : undefined}
            onPress={() => setDetail(item)}
            pressHint={copy.openDetailHint}
          />
        )}
        ItemSeparatorComponent={Separator}
        // 09-4: después de la lista (Documento de Jerarquía).
        ListFooterComponent={
          skipped.length > 0 ? (
            <View style={styles.skipped}>
              <Text style={styles.heading} accessibilityRole="header">
                {copy.MOST_SKIPPED_TITLE}
              </Text>
              {skipped.map((item) => (
                <View key={item.label} style={styles.skippedRow} accessible accessibilityLabel={`${item.label}, ${copy.timesLabel(item.count)}`}>
                  <Text style={styles.skippedLabel}>{item.label}</Text>
                  <Text style={styles.secondary}>{copy.timesLabel(item.count)}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
      {detail ? <RecordDetailSheet entry={detail} onClose={() => setDetail(null)} /> : null}
    </View>
  );
}

function Separator() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.separator} />;
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      padding: spacing.xl,
      paddingTop: spacing.sm,
    },
    statsContent: {
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    filters: {
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    heading: {
      ...typography.h2,
      color: colors.textPrimary,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    separator: {
      height: spacing.md,
    },
    secondary: {
      ...typography.label,
      color: colors.textSecondary,
    },
    skipped: {
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    skippedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    skippedLabel: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
  });
