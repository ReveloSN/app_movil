import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import { BROWSE_TEMPLATES_LABEL } from '@/features/routine-templates/routine-templates.copy';
import { useRoutines } from '@/features/routines/useRoutines';
import { PendingSyncIndicator } from '@/features/sync/PendingSyncIndicator';
import { clearFlashMessage, useFlashMessage } from '@/shared/events/flashMessage';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const EMPTY_MESSAGE = 'Aún no tienes rutinas. Empieza con una plantilla o crea la tuya.'; // EV-01

export default function RoutinesScreen() {
  const { routines, loading, error, refresh } = useRoutines();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  // CF-03 al volver de guardar una rutina con avisos; se descarta al salir de Inicio.
  const flash = useFlashMessage();
  useFocusEffect(useCallback(() => clearFlashMessage, []));

  // Primera carga y error sin datos ocupan toda la pantalla; con datos, se mantiene la lista.
  if (loading && routines.length === 0) return <LoadingState accessibilityLabel="Cargando rutinas" />;
  if (error && routines.length === 0) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <View style={styles.container}>
      {/* Cambios sin subir o con error: ícono + texto. */}
      <PendingSyncIndicator style={styles.syncStatus} />
      {routines.length === 0 ? (
        <EmptyState icon="checkbox-outline" message={EMPTY_MESSAGE} />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(routine) => routine.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            flash || error ? (
              <View style={styles.messages}>
                {flash ? <StatusMessage tone="info" message={flash} /> : null}
                {error ? <StatusMessage tone="error" message={error} /> : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <RoutineCard
              name={item.name}
              icon={item.icon}
              active={item.active}
              lastCompletedAt={item.lastCompletedAt}
              actionLabel={VERIFY_NOW_LABEL}
              onAction={() => router.push({ pathname: '/routine/[id]/verify', params: { id: item.id } })}
              onPress={() => router.push({ pathname: '/routine/[id]/edit', params: { id: item.id } })}
              pressHint="Edita la rutina"
            />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}
      <View style={styles.footer}>
        <PrimaryButton label="Crear rutina" onPress={() => router.push('/routine/new')} />
        {/* Flujo B: Inicio → Plantillas → Crear rutina precargada. */}
        <SecondaryButton icon="albums-outline" label={BROWSE_TEMPLATES_LABEL} onPress={() => router.push('/routine/templates')} />
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
    messages: {
      gap: spacing.md,
    },
    syncStatus: {
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
    },
    list: {
      gap: spacing.md,
      padding: spacing.xl,
    },
    footer: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
  });
