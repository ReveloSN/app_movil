import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { NextRoutineCard } from '@/components/molecules/NextRoutineCard';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { CreateWithAiButton } from '@/features/ai/CreateWithAiButton';
import { VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import { greeting, NEXT_ROUTINE_LABEL, nextRoutineWhen } from '@/features/home/home.copy';
import { BROWSE_TEMPLATES_LABEL } from '@/features/routine-templates/routine-templates.copy';
import { resolveRoutineColor } from '@/features/routines/routine-appearance';
import { useNextRoutine } from '@/features/routines/useNextRoutine';
import { useRoutines } from '@/features/routines/useRoutines';
import { useDisplayName } from '@/features/settings/useDisplayName';
import { PendingSyncIndicator } from '@/features/sync/PendingSyncIndicator';
import { clearFlashMessage, useFlashMessage } from '@/shared/events/flashMessage';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const EMPTY_MESSAGE = 'Aún no tienes rutinas. Empieza con una plantilla o crea la tuya.'; // EV-01

const openVerification = (routineId: string) => router.push({ pathname: '/routine/[id]/verify', params: { id: routineId } });

export default function RoutinesScreen() {
  const { routines, loading, error, refresh } = useRoutines();
  const { next, now } = useNextRoutine();
  const displayName = useDisplayName();
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
        <View style={styles.empty}>
          <EmptyState icon="checkbox-outline" message={EMPTY_MESSAGE} />
          {/* Alternativa secundaria a crear o usar una plantilla (EV-01). */}
          <View style={styles.emptyAction}>
            <CreateWithAiButton />
          </View>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(routine) => routine.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.messages}>
              {/* 03-1 */}
              <Text style={styles.greeting} accessibilityRole="header">
                {greeting(displayName, now)}
              </Text>
              {flash ? <StatusMessage tone="info" message={flash} /> : null}
              {error ? <StatusMessage tone="error" message={error} /> : null}
              {/* 03-2: solo si hay alguna rutina programada por horario. */}
              {next ? (
                <NextRoutineCard
                  label={NEXT_ROUTINE_LABEL}
                  name={next.routineName}
                  when={nextRoutineWhen(next.at, now)}
                  actionLabel={VERIFY_NOW_LABEL}
                  onAction={() => openVerification(next.routineId)}
                />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <RoutineCard
              name={item.name}
              icon={item.icon}
              accentColor={colors[resolveRoutineColor(item.color).token]}
              active={item.active}
              lastCompletedAt={item.lastCompletedAt}
              actionLabel={VERIFY_NOW_LABEL}
              onAction={() => openVerification(item.id)}
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

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    messages: {
      gap: spacing.md,
    },
    empty: {
      flex: 1,
    },
    emptyAction: {
      paddingHorizontal: spacing.xl,
    },
    greeting: {
      ...typography.body,
      color: colors.textSecondary,
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
