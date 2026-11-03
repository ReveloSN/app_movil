import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmphasisPulse } from '@/components/atoms/EmphasisPulse';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { ChecklistItemRow } from '@/components/molecules/ChecklistItemRow';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { SegmentedControl, type SegmentOption } from '@/components/molecules/SegmentedControl';
import { SkeletonList } from '@/components/molecules/SkeletonList';
import { VerifyHeader } from '@/components/molecules/VerifyHeader';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import * as copy from '@/features/checklist/checklist.copy';
import { ChecklistDeck } from '@/features/checklist/ChecklistDeck';
import type { ViewMode } from '@/features/checklist/checklist.viewmode';
import { useViewModePreference } from '@/features/checklist/useViewModePreference';
import { firstUncheckedCritical, isEmptyDone, lastCriticalIndex } from '@/features/checklist/checklist.outcome';
import type { FinishIntent } from '@/features/checklist/checklist.types';
import { toSummaryParams } from '@/features/checklist/summaryParams';
import { useChecklist } from '@/features/checklist/useChecklist';
import { closeRoutineOccurrences } from '@/features/notifications/occurrence.lifecycle';
import { useFinishChecklist } from '@/features/checklist/useFinishChecklist';
import { dispatchToOwner } from '@/features/forms/useUnsavedChangesGuard';
import { usePostponeChecklist } from '@/features/checklist/usePostponeChecklist';
import { displayIconForItem } from '@/features/routines/item-icon-guess';
import { resolveRoutineIcon, routineAccent } from '@/features/routines/routine-appearance';
import { useRoutines } from '@/features/routines/useRoutines';
import { WeatherHint } from '@/features/weather/WeatherHint';
import { hapticConfirm, hapticToggleOff, hapticToggleOn } from '@/shared/haptics/haptics';
import { durations, staggerDelay } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

// Entrada de los ítems críticos: corta y desde la izquierda; nunca retrasa poder marcarlos.
const criticalEntering = (index: number) =>
  FadeInLeft.duration(durations.base).delay(staggerDelay(index)).reduceMotion(ReduceMotion.System);

const VIEW_MODES: readonly SegmentOption<ViewMode>[] = [
  { value: 'list', label: copy.VIEW_LIST_LABEL },
  { value: 'deck', label: copy.VIEW_DECK_LABEL },
];

type Dialog =
  | { kind: 'critical'; label: string; intent: FinishIntent }
  | { kind: 'empty' }
  | { kind: 'exit'; action: NavigationAction }
  | null;

// Los diálogos de salir y de "Listo" sin marcar comparten botones del brief; el crítico (DC-02) tiene los suyos.
function dialogCopy(dialog: Dialog) {
  if (dialog?.kind === 'critical') {
    return { message: copy.criticalSkipMessage(dialog.label), confirm: copy.CRITICAL_SKIP_CONFIRM, cancel: copy.CRITICAL_SKIP_CANCEL };
  }
  if (dialog?.kind === 'empty') {
    return { message: copy.EMPTY_DONE_MESSAGE, confirm: copy.CRITICAL_SKIP_CONFIRM, cancel: copy.CRITICAL_SKIP_CANCEL };
  }
  return { message: copy.EXIT_MESSAGE, confirm: copy.EXIT_CONFIRM, cancel: copy.EXIT_CANCEL };
}

export default function VerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const routine = useRoutines().routines.find((candidate) => candidate.id === id);
  const routineName = routine?.name ?? '';
  const accent = routineAccent(colors, routine?.color);
  const { items, loading, error, retry, toggleItem, setItemChecked, addTemporaryItem, progress, startedAt } = useChecklist(id);
  // Lo elegido aquí manda; si no, la preferencia de Ajustes (abre en la lista mientras se lee).
  const [chosenMode, setChosenMode] = useState<ViewMode | null>(null);
  const { preferred } = useViewModePreference();
  const viewMode = chosenMode ?? preferred ?? 'list';
  const { finish, finishing, error: finishError } = useFinishChecklist(id, items, startedAt);
  const postponement = usePostponeChecklist({ routineId: id, routineName, itemCount: items.length });
  const busy = finishing || postponement.postponing;
  const [dialog, setDialog] = useState<Dialog>(null);
  // true cuando la salida ya está decidida (terminó o confirmó "Salir"): no se vuelve a preguntar.
  const leaving = useRef(false);

  // Cubre la X, el botón atrás de Android y el gesto de iOS: solo pregunta si ya hay algo marcado.
  usePreventRemove(progress.checked > 0, ({ data }) => {
    if (leaving.current) dispatchToOwner(navigation, data.action);
    else setDialog({ kind: 'exit', action: data.action });
  });

  async function complete(intent: FinishIntent) {
    const summary = await finish(intent);
    if (!summary) return; // El error se muestra sobre los botones.
    if (summary.outcome === 'completed') hapticConfirm();
    // Las notificaciones ya sonadas de esta rutina quedan respondidas (no cuentan como "sin respuesta").
    closeRoutineOccurrences(id, Date.now()).catch((cause: unknown) => {
      if (__DEV__) console.warn('[notifications.close]', cause);
    });
    leaving.current = true;
    router.replace({ pathname: '/routine/[id]/summary', params: toSummaryParams(id, summary) });
  }

  /** Posponer: cierra el modal y vuelve al origen; los recordatorios avisan en N minutos. */
  async function postpone() {
    if (!(await postponement.postpone())) return; // El error se muestra sobre los botones.
    leaving.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  // Marcar es instantáneo; el háptico ligero acompaña (y sigue el ajuste del sistema).
  function toggle(itemId: string, wasChecked: boolean) {
    toggleItem(itemId);
    if (wasChecked) hapticToggleOff();
    else hapticToggleOn();
  }

  // DC-02 antes de dejar sin marcar un crítico, con "Listo" o con "Omitir por hoy".
  function finishAsking(intent: FinishIntent) {
    if (isEmptyDone(items, intent)) {
      setDialog({ kind: 'empty' });
      return;
    }
    const critical = firstUncheckedCritical(items);
    if (critical) setDialog({ kind: 'critical', label: critical.label, intent });
    else void complete(intent);
  }

  function confirmDialog() {
    if (dialog?.kind === 'critical') void complete(dialog.intent);
    // Confirmó que no marcó nada: se guarda como omitida, no como parcial de 0.
    if (dialog?.kind === 'empty') void complete('skip');
    if (dialog?.kind === 'exit') {
      leaving.current = true;
      dispatchToOwner(navigation, dialog.action);
    }
    setDialog(null);
  }

  const shownDialog = dialogCopy(dialog);
  // La sugerencia del clima va tras el último crítico (los críticos suben, Documento 2); sin críticos, arriba.
  const hintIndex = lastCriticalIndex(items);
  const weatherHint = <WeatherHint onAdd={addTemporaryItem} />;

  const body = loading ? (
    <SkeletonList variant="row" rows={4} accessibilityLabel="Cargando ítems" />
  ) : error ? (
    <ErrorState message={error} onRetry={retry} />
  ) : items.length === 0 ? (
    <EmptyState icon="list-outline" message="Esta rutina no tiene ítems." />
  ) : (
    <>
      <View style={styles.modeToggle}>
        <SegmentedControl<ViewMode>
          accessibilityLabel={copy.VIEW_MODE_LABEL}
          options={VIEW_MODES}
          value={viewMode}
          onChange={setChosenMode}
        />
      </View>
      {viewMode === 'deck' ? (
        <ChecklistDeck items={items} setItemChecked={setItemChecked} />
      ) : (
      <FlatList
        style={styles.list}
        // Sugerencia del clima (si llega a tiempo): discreta y sin bloquear nada.
        ListHeaderComponent={hintIndex < 0 ? weatherHint : null}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Los críticos (arriba) entran con un desplazamiento discreto para que se noten primero.
          const row = (
            <Animated.View entering={item.critical ? criticalEntering(index) : undefined}>
              <ChecklistItemRow
                label={item.label}
                // Sin ícono elegido (cubo por defecto): se deduce de la etiqueta.
                icon={displayIconForItem(item.icon, item.label)}
                critical={item.critical}
                criticalLabel={copy.CRITICAL_LABEL}
                note={item.note}
                checked={item.checked}
                onToggle={() => toggle(item.id, item.checked)}
              />
            </Animated.View>
          );
          return index === hintIndex ? (
            <View style={styles.rowWithHint}>
              {row}
              {weatherHint}
            </View>
          ) : (
            row
          );
        }}
      />
      )}
      <ScreenFooter>
        {finishError ? <StatusMessage tone="error" message={finishError} /> : null}
        {postponement.error ? <StatusMessage tone="error" message={postponement.error} /> : null}
        {/* 07-6: fila 1 la primaria a todo el ancho; fila 2 secundaria y terciaria lado a lado. */}
        {/* Énfasis único cuando todo está marcado: invita a cerrar sin bloquear nada. */}
        <EmphasisPulse active={progress.total > 0 && progress.checked === progress.total}>
          <PrimaryButton
            label={copy.DONE_LABEL}
            onPress={() => finishAsking('done')}
            loading={finishing}
            disabled={postponement.postponing}
          />
        </EmphasisPulse>
        <View style={styles.secondaryActions}>
          <View style={styles.half}>
            <SecondaryButton
              label={copy.postponeLabel(postponement.snoozeMinutes)}
              onPress={() => void postpone()}
              disabled={busy}
            />
          </View>
          <View style={styles.half}>
            <TextButton label={copy.SKIP_TODAY_LABEL} onPress={() => finishAsking('skip')} disabled={busy} />
          </View>
        </View>
      </ScreenFooter>
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <VerifyHeader
        name={routineName}
        icon={resolveRoutineIcon(routine?.icon)}
        accentColor={accent.color}
        accentTint={accent.tint}
        checked={progress.checked}
        total={progress.total}
        closeLabel={copy.CLOSE_VERIFY_LABEL}
        countLabel={copy.progressCount(progress.checked, progress.total)}
        progressLabel={copy.progressSpoken(progress.checked, progress.total)}
        onClose={() => router.back()}
      />
      {body}
      <ConfirmDialog
        visible={dialog !== null}
        message={shownDialog.message}
        confirmLabel={shownDialog.confirm}
        cancelLabel={shownDialog.cancel}
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // La lista se lleva todo el alto libre y hace scroll; el pie queda fijo. En 360×640 dp (barra de
    // estado 24, navegación por gestos 24): encabezado 8+34+8+16+8 = 74, pie 12+52+8+48+12 = 132,
    // lista 640−48−74−132 = 386 dp (60,3 %, 6 filas de 56 + 8). Con la barra de 3 botones (48) quedan
    // 362 dp (56,6 %): no se fuerza un mínimo porque empujaría "Listo" fuera de la vista.
    modeToggle: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    rowWithHint: {
      gap: spacing.sm,
    },
    secondaryActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    half: {
      flex: 1,
    },
  });
