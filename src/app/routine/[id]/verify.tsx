import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/atoms/IconButton';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { ChecklistItemRow } from '@/components/molecules/ChecklistItemRow';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { LoadingState } from '@/components/molecules/LoadingState';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import * as copy from '@/features/checklist/checklist.copy';
import { firstUncheckedCritical } from '@/features/checklist/checklist.outcome';
import type { FinishIntent } from '@/features/checklist/checklist.types';
import { toSummaryParams } from '@/features/checklist/summaryParams';
import { useChecklist } from '@/features/checklist/useChecklist';
import { closeRoutineOccurrences } from '@/features/notifications/occurrence.lifecycle';
import { useFinishChecklist } from '@/features/checklist/useFinishChecklist';
import { usePostponeChecklist } from '@/features/checklist/usePostponeChecklist';
import { useRoutines } from '@/features/routines/useRoutines';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

type Dialog = { kind: 'critical'; label: string; intent: FinishIntent } | { kind: 'exit'; action: NavigationAction } | null;

export default function VerifyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const routineName = useRoutines().routines.find((routine) => routine.id === id)?.name ?? '';
  const { items, loading, error, retry, toggleItem, progress, startedAt } = useChecklist(id);
  const { finish, finishing, error: finishError } = useFinishChecklist(id, items, startedAt);
  const postponement = usePostponeChecklist({ routineId: id, routineName, itemCount: items.length });
  const busy = finishing || postponement.postponing;
  const [dialog, setDialog] = useState<Dialog>(null);
  // true cuando la salida ya está decidida (terminó o confirmó "Salir"): no se vuelve a preguntar.
  const leaving = useRef(false);

  // Cubre la X, el botón atrás de Android y el gesto de iOS: solo pregunta si ya hay algo marcado.
  usePreventRemove(progress.checked > 0, ({ data }) => {
    if (leaving.current) navigation.dispatch(data.action);
    else setDialog({ kind: 'exit', action: data.action });
  });

  async function complete(intent: FinishIntent) {
    const summary = await finish(intent);
    if (!summary) return; // El error se muestra sobre los botones.
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

  // DC-02 antes de dejar sin marcar un crítico, con "Listo" o con "Omitir por hoy".
  function finishAsking(intent: FinishIntent) {
    const critical = firstUncheckedCritical(items);
    if (critical) setDialog({ kind: 'critical', label: critical.label, intent });
    else void complete(intent);
  }

  function confirmDialog() {
    if (dialog?.kind === 'critical') void complete(dialog.intent);
    if (dialog?.kind === 'exit') {
      leaving.current = true;
      navigation.dispatch(dialog.action);
    }
    setDialog(null);
  }

  const body = loading ? (
    <LoadingState accessibilityLabel="Cargando ítems" />
  ) : error ? (
    <ErrorState message={error} onRetry={retry} />
  ) : items.length === 0 ? (
    <EmptyState icon="list-outline" message="Esta rutina no tiene ítems." />
  ) : (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChecklistItemRow
            label={item.label}
            icon={item.icon}
            critical={item.critical}
            criticalLabel={copy.CRITICAL_LABEL}
            note={item.note}
            checked={item.checked}
            onToggle={() => toggleItem(item.id)}
          />
        )}
      />
      <View style={styles.footer}>
        {finishError ? <StatusMessage tone="error" message={finishError} /> : null}
        {postponement.error ? <StatusMessage tone="error" message={postponement.error} /> : null}
        {/* 07-6: fila 1 la primaria a todo el ancho; fila 2 secundaria y terciaria lado a lado. */}
        <PrimaryButton
          label={copy.DONE_LABEL}
          onPress={() => finishAsking('done')}
          loading={finishing}
          disabled={postponement.postponing}
        />
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
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
            {routineName}
          </Text>
          <IconButton icon="close" accessibilityLabel="Cerrar verificación" onPress={() => router.back()} />
        </View>
        <ProgressBar
          value={progress.checked}
          max={progress.total}
          accessibilityLabel={`${progress.checked} de ${progress.total} ítems listos`}
        />
      </View>
      {body}
      <ConfirmDialog
        visible={dialog !== null}
        message={dialog?.kind === 'critical' ? copy.criticalSkipMessage(dialog.label) : copy.EXIT_MESSAGE}
        confirmLabel={dialog?.kind === 'critical' ? copy.CRITICAL_SKIP_CONFIRM : copy.EXIT_CONFIRM}
        cancelLabel={dialog?.kind === 'critical' ? copy.CRITICAL_SKIP_CANCEL : copy.EXIT_CANCEL}
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    // La lista se lleva todo el alto libre y hace scroll; el pie queda fijo. En 360×640 dp (barra de
    // estado 24, navegación por gestos 24): encabezado 8+34+12+6+12 = 72, pie 12+52+8+44+12 = 128,
    // lista 640−48−72−128 = 392 dp (61 %, 6 filas de 56 + 8). Con la barra de 3 botones (48) quedan
    // 368 dp (57,5 %): no se fuerza un mínimo porque empujaría "Listo" fuera de la vista.
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
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
