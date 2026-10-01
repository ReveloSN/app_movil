import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { useRoutines } from '@/features/routines/useRoutines';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const EMPTY_MESSAGE = 'Aún no tienes rutinas. Empieza con una plantilla o crea la tuya.'; // EV-01

export default function RoutinesScreen() {
  const { routines, loading, error, refresh } = useRoutines();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  // Primera carga y error sin datos ocupan toda la pantalla; con datos, se mantiene la lista.
  if (loading && routines.length === 0) return <LoadingState accessibilityLabel="Cargando rutinas" />;
  if (error && routines.length === 0) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <View style={styles.container}>
      {routines.length === 0 ? (
        <EmptyState icon="checkbox-outline" message={EMPTY_MESSAGE} />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(routine) => routine.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <StatusMessage tone="error" message={error} /> : null}
          renderItem={({ item }) => (
            <RoutineCard name={item.name} icon={item.icon} active={item.active} lastCompletedAt={item.lastCompletedAt} />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}
      <View style={styles.footer}>
        <PrimaryButton label="Crear rutina" onPress={() => router.push('/routine/new')} />
      </View>
    </View>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      gap: spacing.md,
      padding: spacing.xl,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
  });
