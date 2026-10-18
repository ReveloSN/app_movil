import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { FilterChips } from '@/components/molecules/FilterChips';
import { HistoryRecordRow } from '@/components/molecules/HistoryRecordRow';
import { SkeletonList } from '@/components/molecules/SkeletonList';
import * as copy from '@/features/history/history.copy';
import { formatDayHeading } from '@/features/history/history.dates';
import { filterRecords, mostSkippedItems, NO_FILTER, type HistoryFilter } from '@/features/history/history.filter';
import { groupRecordsByDay } from '@/features/history/history.grouping';
import { describeResult, RESULT_FILTERS } from '@/features/history/history.result';
import type { HistoryEntry } from '@/features/history/history.types';
import { RecordDetailSheet } from '@/features/history/RecordDetailSheet';
import { useHistory } from '@/features/history/useHistory';
import { WeekSummarySection } from '@/features/insights/WeekSummarySection';
import { useTabSwipeLockHandlers } from '@/features/navigation/TabSwipeLock';
import { useRoutines } from '@/features/routines/useRoutines';
import { PENDING_SYNC_LABEL } from '@/features/sync/sync.copy';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const ALL = '';

export default function HistoryScreen() {
  const { records, loading, error, refresh } = useHistory();
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
  if (loading && records.length === 0) return <SkeletonList rows={5} accessibilityLabel="Cargando historial" />;
  if (error && records.length === 0) return <ErrorState message={error} onRetry={refresh} />;
  if (records.length === 0) return <EmptyState icon="time-outline" message={copy.EMPTY_MESSAGE} />;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(record) => record.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.filters}>
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
