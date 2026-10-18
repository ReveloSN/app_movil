import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyRing } from '@/components/molecules/EmptyRing';
import { ErrorState } from '@/components/molecules/ErrorState';
import { NextRoutineCard } from '@/components/molecules/NextRoutineCard';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { SkeletonList } from '@/components/molecules/SkeletonList';
import { SkyBand } from '@/components/molecules/SkyBand';
import { CreateWithAiButton } from '@/features/ai/CreateWithAiButton';
import { VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import { greeting, NEXT_ROUTINE_LABEL, nextRoutineWhen, todayLabel } from '@/features/home/home.copy';
import { homeSky } from '@/features/home/homeSky';
import { BROWSE_TEMPLATES_LABEL } from '@/features/routine-templates/routine-templates.copy';
import { resolveRoutineIcon, routineAccent } from '@/features/routines/routine-appearance';
import { useNextRoutine } from '@/features/routines/useNextRoutine';
import { useRoutines } from '@/features/routines/useRoutines';
import { useDisplayName } from '@/features/settings/useDisplayName';
import { usePrefetchWeather } from '@/features/weather/WeatherHint';
import { PendingSyncIndicator } from '@/features/sync/PendingSyncIndicator';
import { clearFlashMessage, useFlashMessage } from '@/shared/events/flashMessage';
import { useFirstAppearance } from '@/shared/hooks/useFirstAppearance';
import { fadeIn, staggeredEntering } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const EMPTY_MESSAGE = 'Aún no tienes rutinas. Empieza con una plantilla o crea la tuya.'; // EV-01

const openVerification = (routineId: string) => router.push({ pathname: '/routine/[id]/verify', params: { id: routineId } });
const openTemplates = () => router.push('/routine/templates');

/** P03: banda con el cielo de la hora, próxima rutina, tarjetas, plantillas y pie con "Crear con IA" y "Crear rutina". */
export default function RoutinesScreen() {
  const { routines, loading, error, refresh } = useRoutines();
  const { next, now } = useNextRoutine();
  const displayName = useDisplayName();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const nextRoutine = next ? routines.find((routine) => routine.id === next.routineId) : undefined;
  const nextAccent = routineAccent(colors, nextRoutine?.color);
  const sky = homeSky(now);
  // Clima en caché al abrir la app, para que la verificación no espere.
  usePrefetchWeather();
  // Las tarjetas entran escalonadas solo la primera vez que se ve Inicio en esta sesión.
  const firstAppearance = useFirstAppearance('home-routines');
  // Avisos de la sincronización (conflicto, error); se descartan al salir de Inicio.
  const flash = useFlashMessage();
  useFocusEffect(useCallback(() => clearFlashMessage, []));

  // Primera carga y error sin datos ocupan toda la pantalla; con datos, se mantiene la lista.
  if (loading && routines.length === 0) return <SkeletonList accessibilityLabel="Cargando rutinas" />;
  if (error && routines.length === 0) return <ErrorState message={error} onRetry={refresh} />;

  const header = (
    <View style={styles.header}>
      <SkyBand
        top={sky.top}
        horizon={sky.horizon}
        textColor={sky.text}
        scrimColor={sky.scrim}
        scrimAlpha={sky.scrimAlpha}
        date={todayLabel(now)}
        greeting={greeting(displayName, now)}
      />
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
          icon={resolveRoutineIcon(nextRoutine?.icon)}
          accentColor={nextAccent.color}
          accentTint={nextAccent.tint}
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cambios sin subir o con error: ícono + texto. */}
      <PendingSyncIndicator style={styles.syncStatus} />
      <FlatList
        data={routines}
        keyExtractor={(routine) => routine.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          // EV-01 reemplaza a las tarjetas (P1) y ofrece las plantillas.
          <Animated.View entering={fadeIn} style={styles.empty} accessible accessibilityLabel={EMPTY_MESSAGE}>
            <EmptyRing icon="checkbox-outline" />
            <Text style={styles.emptyText}>{EMPTY_MESSAGE}</Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={firstAppearance ? staggeredEntering(index) : undefined}>
            <RoutineCard
              name={item.name}
              icon={item.icon}
              accentColor={routineAccent(colors, item.color).color}
              accentTint={routineAccent(colors, item.color).tint}
              active={item.active}
              lastCompletedAt={item.lastCompletedAt}
              actionLabel={VERIFY_NOW_LABEL}
              onAction={() => openVerification(item.id)}
              onPress={() => router.push({ pathname: '/routine/[id]/edit', params: { id: item.id } })}
              pressHint="Edita la rutina"
            />
          </Animated.View>
        )}
        // Flujo B: Inicio → Plantillas → Crear rutina precargada.
        ListFooterComponent={<SecondaryButton icon="albums-outline" label={BROWSE_TEMPLATES_LABEL} onPress={openTemplates} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
      {/* La primaria en la zona del pulgar; "Crear con IA" (si está activa) justo encima. */}
      <View style={styles.footer}>
        <CreateWithAiButton />
        <PrimaryButton label="Crear rutina" onPress={() => router.push('/routine/new')} />
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
    header: {
      gap: spacing.md,
    },
    empty: {
      gap: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
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
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  });
