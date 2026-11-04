import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyRing } from '@/components/molecules/EmptyRing';
import { ErrorState } from '@/components/molecules/ErrorState';
import { NextRoutineCard } from '@/components/molecules/NextRoutineCard';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { SkeletonList } from '@/components/molecules/SkeletonList';
import { SkyBand } from '@/components/molecules/SkyBand';
import { DEPARTURE_MODE_LABEL, VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import { editRoutineLabel, greeting, NEXT_ROUTINE_LABEL, nextRoutineDescription, todayLabel, VERIFY_PRESS_HINT } from '@/features/home/home.copy';
import { homeSky } from '@/features/home/homeSky';
import { AddRoutineMenu } from '@/features/routines/AddRoutineMenu';
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
const openDepartureMode = (routineId: string) => router.push({ pathname: '/routine/[id]/go', params: { id: routineId } });

/** P03: banda con el cielo de la hora, próxima rutina, tarjetas y el botón "+" con las formas de crear una rutina. */
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
      {/* 03-2: solo si hay alguna rutina con aviso por horario o por Wi-Fi. */}
      {next ? (
        <NextRoutineCard
          label={NEXT_ROUTINE_LABEL}
          name={next.routineName}
          when={nextRoutineDescription(next, now)}
          actionLabel={VERIFY_NOW_LABEL}
          onAction={() => openVerification(next.routineId)}
          secondaryLabel={DEPARTURE_MODE_LABEL}
          onSecondaryAction={() => openDepartureMode(next.routineId)}
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
              // Documento 3, P03: el cuerpo verifica; editar es el botón de lápiz.
              onPress={() => openVerification(item.id)}
              pressHint={VERIFY_PRESS_HINT}
              onEdit={() => router.push({ pathname: '/routine/[id]/edit', params: { id: item.id } })}
              editLabel={editRoutineLabel(item.name)}
            />
          </Animated.View>
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      />
      {/* En la zona del pulgar: crear una, crear con IA (si está activa) o elegir una plantilla (flujo B). */}
      <AddRoutineMenu containerStyle={styles.fab} />
    </View>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
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
      // La última tarjeta puede subir por encima del botón "+".
      paddingBottom: sizes.fabSize + spacing.xl * 2,
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: spacing.xl,
    },
  });
