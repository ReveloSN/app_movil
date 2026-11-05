import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { NextRoutineCard } from '@/components/molecules/NextRoutineCard';
import { RoutineCard } from '@/components/molecules/RoutineCard';
import { HomeSkeleton } from '@/components/molecules/HomeSkeleton';
import { SkyBand } from '@/components/molecules/SkyBand';
import { DEPARTURE_MODE_LABEL, VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import {
  ARRIVAL_SECTION_TITLE,
  editRoutineLabel,
  EMPTY_ROUTINES_ACTION,
  EMPTY_ROUTINES_MESSAGE,
  EMPTY_ROUTINES_TITLE,
  greeting,
  LOADING_ROUTINES_LABEL,
  NEXT_ROUTINE_LABEL,
  nextRoutineDescription,
  todayLabel,
  VERIFY_AGAIN_LABEL,
  VERIFY_PRESS_HINT,
} from '@/features/home/home.copy';
import { homeSky } from '@/features/home/homeSky';
import { AddRoutineMenu } from '@/features/routines/AddRoutineMenu';
import { resolveRoutineIcon, routineAccent } from '@/features/routines/routine-appearance';
import { arrivalRoutines, canVerifyFromHome, departureRoutines } from '@/features/routines/routine-list';
import { useNextRoutine } from '@/features/routines/useNextRoutine';
import { useRoutines } from '@/features/routines/useRoutines';
import { useDisplayName } from '@/features/settings/useDisplayName';
import { usePrefetchWeather } from '@/features/weather/WeatherHint';
import { PendingSyncIndicator } from '@/features/sync/PendingSyncIndicator';
import { clearFlashMessage, useFlashMessage } from '@/shared/events/flashMessage';
import { useFirstAppearance } from '@/shared/hooks/useFirstAppearance';
import { staggeredEntering } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Routine } from '@/shared/types/routine.types';
import { isSameLocalDay } from '@/shared/utils/isSameLocalDay';

const openTemplates = () => router.push('/routine/templates');
const openVerification = (routineId: string) => router.push({ pathname: '/routine/[id]/verify', params: { id: routineId } });
const openDepartureMode = (routineId: string) => router.push({ pathname: '/routine/[id]/go', params: { id: routineId } });

/** P03: banda con el cielo de la hora, próxima rutina, tarjetas y el botón "+" con las formas de crear una rutina. */
export default function RoutinesScreen() {
  const { routines, loading, error, refresh } = useRoutines();
  const { next, now } = useNextRoutine();
  const displayName = useDisplayName();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  // Las salidas van arriba; las de llegada, aparte en «Al llegar».
  const departures = useMemo(() => departureRoutines(routines), [routines]);
  const arrivals = useMemo(() => arrivalRoutines(routines), [routines]);
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
  if (loading && routines.length === 0) return <HomeSkeleton loading accessibilityLabel={LOADING_ROUTINES_LABEL} />;
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

  // Las de llegada no se verifican desde aquí (ensuciaría el historial de salidas): solo se editan.
  const renderCard = (item: Routine) => {
    const verifiable = canVerifyFromHome(item);
    const completedToday = verifiable && isSameLocalDay(item.lastCompletedAt, now);
    return (
      <RoutineCard
        name={item.name}
        icon={item.icon}
        accentColor={routineAccent(colors, item.color).color}
        accentTint={routineAccent(colors, item.color).tint}
        active={item.active}
        lastCompletedAt={item.lastCompletedAt}
        completedToday={completedToday}
        actionLabel={verifiable ? (completedToday ? VERIFY_AGAIN_LABEL : VERIFY_NOW_LABEL) : undefined}
        onAction={verifiable ? () => openVerification(item.id) : undefined}
        // Documento 3, P03: el cuerpo verifica; editar es el botón de lápiz.
        onPress={verifiable ? () => openVerification(item.id) : undefined}
        pressHint={VERIFY_PRESS_HINT}
        onEdit={() => router.push({ pathname: '/routine/[id]/edit', params: { id: item.id } })}
        editLabel={editRoutineLabel(item.name)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Cambios sin subir o con error: ícono + texto. */}
      <PendingSyncIndicator style={styles.syncStatus} />
      <FlatList
        data={departures}
        keyExtractor={(routine) => routine.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          // EV-01 reemplaza a las tarjetas (P1) y ofrece las plantillas. Con solo rutinas de llegada no aplica.
          arrivals.length > 0 ? null : (
            <EmptyState
              inline
              illustration="noRoutines"
              title={EMPTY_ROUTINES_TITLE}
              message={EMPTY_ROUTINES_MESSAGE}
              action={{ label: EMPTY_ROUTINES_ACTION, onPress: openTemplates }}
            />
          )
        }
        ListFooterComponent={
          arrivals.length > 0 ? (
            <View style={styles.arrivals}>
              <SectionLabel label={ARRIVAL_SECTION_TITLE} />
              {arrivals.map((routine) => (
                <View key={routine.id}>{renderCard(routine)}</View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={firstAppearance ? staggeredEntering(index) : undefined}>
            {renderCard(item)}
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

const createStyles = ({ colors, sizes, spacing }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: spacing.md,
    },
    arrivals: {
      gap: spacing.md,
      marginTop: spacing.lg,
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
