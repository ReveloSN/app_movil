import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { HistoryRecordRow } from '@/components/molecules/HistoryRecordRow';
import { LoadingState } from '@/components/molecules/LoadingState';
import { formatDayHeading } from '@/features/history/history.dates';
import { describeResult } from '@/features/history/history.result';
import { useHistory } from '@/features/history/useHistory';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const EMPTY_MESSAGE = 'Aquí verás cada verificación que hagas.'; // EV-02

export default function HistoryScreen() {
  const { groups, loading, error, refresh } = useHistory();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  // La pestaña queda montada: al volver a ella se recarga para incluir las verificaciones recién hechas.
  // El primer foco se salta porque useHistory ya hace la carga inicial.
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedBefore.current) void refresh();
      focusedBefore.current = true;
    }, [refresh]),
  );

  const sections = useMemo(
    () => groups.map((group) => ({ key: group.date, title: formatDayHeading(group.date), data: group.records })),
    [groups],
  );

  // Primera carga y error sin datos ocupan toda la pantalla; con datos, se mantiene la lista.
  if (loading && groups.length === 0) return <LoadingState accessibilityLabel="Cargando historial" />;
  if (error && groups.length === 0) return <ErrorState message={error} onRetry={refresh} />;
  if (groups.length === 0) return <EmptyState icon="time-outline" message={EMPTY_MESSAGE} />;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(record) => record.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={error ? <StatusMessage tone="error" message={error} /> : null}
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
          />
        )}
        ItemSeparatorComponent={Separator}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
    </View>
  );
}

function Separator() {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.separator} />;
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      padding: spacing.xl,
      paddingTop: spacing.sm,
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
  });
