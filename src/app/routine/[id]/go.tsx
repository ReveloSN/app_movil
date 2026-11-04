import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/atoms/IconButton';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { BigChecklistItem } from '@/components/molecules/BigChecklistItem';
import { CelebrationCheck } from '@/components/molecules/CelebrationCheck';
import { ConfettiBurst } from '@/components/molecules/ConfettiBurst';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorState } from '@/components/molecules/ErrorState';
import { ProgressRing } from '@/components/molecules/ProgressRing';
import { SkeletonList } from '@/components/molecules/SkeletonList';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import * as copy from '@/features/checklist/checklist.copy';
import { completesWithToggle } from '@/features/checklist/checklist.progress';
import { useChecklist } from '@/features/checklist/useChecklist';
import { useChecklistDraft } from '@/features/checklist/useChecklistDraft';
import { useFinishChecklist } from '@/features/checklist/useFinishChecklist';
import { useVerificationFlow } from '@/features/checklist/useVerificationFlow';
import { displayIconForItem } from '@/features/routines/item-icon-guess';
import { resolveRoutineIcon, routineAccent } from '@/features/routines/routine-appearance';
import { useRoutines } from '@/features/routines/useRoutines';
import { hapticConfirm, hapticToggleOff, hapticToggleOn } from '@/shared/haptics/haptics';
import { durations, fadeIn, staggeredEntering } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

// Pausa para ver (y oír) la celebración antes de guardar y pasar al resumen.
const CELEBRATION_MS = durations.slow * 5;

/**
 * Modo salida: la misma verificación de /routine/[id]/verify (mismo borrador de hoy, mismo registro y
 * misma sincronización) en pantalla completa: anillo de avance arriba, ítems grandes y "Listo, salgo".
 */
export default function DepartureModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useThemedStyles(createStyles);
  const { colors, iconSizes } = useAppTheme();
  const routine = useRoutines().routines.find((candidate) => candidate.id === id);
  const routineName = routine?.name ?? '';
  const accent = routineAccent(colors, routine?.color);
  const { items, loading, error, retry, toggleItem, applyChecked, progress, startedAt } = useChecklist(id);
  const { discard: discardDraft } = useChecklistDraft(id, loading, items, applyChecked);
  const { finish, finishing, error: finishError } = useFinishChecklist(id, items, startedAt);
  const [celebrating, setCelebrating] = useState(false);
  // La celebración ya trae su háptico: el cierre no lo repite. Mientras dura, "atrás" se ignora.
  const flow = useVerificationFlow({
    routineId: id,
    items,
    progress,
    finish,
    discardDraft,
    confirmHaptic: false,
    exitBlocked: celebrating,
  });

  // Al completar, tras la celebración se guarda igual que "Listo" en verify; si falla, vuelve la lista con su error.
  const completeRef = useRef(flow.complete);
  useEffect(() => {
    completeRef.current = flow.complete;
  });
  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => {
      void completeRef.current('done').then((saved) => {
        if (!saved) setCelebrating(false);
      });
    }, CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebrating]);

  function toggle(itemId: string, wasChecked: boolean) {
    const completes = completesWithToggle(progress, wasChecked);
    toggleItem(itemId);
    if (completes) {
      hapticConfirm();
      setCelebrating(true);
    } else if (wasChecked) hapticToggleOff();
    else hapticToggleOn();
  }

  const busy = finishing || celebrating;

  const body = loading ? (
    <SkeletonList variant="row" rows={4} accessibilityLabel="Cargando ítems" />
  ) : error ? (
    <ErrorState message={error} onRetry={retry} />
  ) : items.length === 0 ? (
    <EmptyState icon="list-outline" message="Esta rutina no tiene ítems." />
  ) : (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <Animated.View entering={staggeredEntering(index)}>
          <BigChecklistItem
            label={item.label}
            // Sin ícono elegido (cubo por defecto): se deduce de la etiqueta.
            icon={displayIconForItem(item.icon, item.label)}
            critical={item.critical}
            criticalLabel={copy.CRITICAL_LABEL}
            checked={item.checked}
            onToggle={() => toggle(item.id, item.checked)}
          />
        </Animated.View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: accent.tint }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name={resolveRoutineIcon(routine?.icon)} size={iconSizes.md} color={accent.color} />
        </View>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
          {routineName}
        </Text>
        <IconButton icon="close" accessibilityLabel={copy.CLOSE_DEPARTURE_LABEL} onPress={() => router.back()} />
      </View>
      <View style={styles.ring}>
        <ProgressRing
          value={progress.checked}
          max={progress.total}
          centerLabel={copy.ringCenter(progress.checked, progress.total)}
          accessibilityLabel={copy.progressSpoken(progress.checked, progress.total)}
        />
      </View>
      {body}
      <ScreenFooter>
        {finishError ? <StatusMessage tone="error" message={finishError} /> : null}
        <PrimaryButton label={copy.DEPARTURE_DONE_LABEL} onPress={() => flow.finishAsking('done')} loading={finishing} disabled={celebrating} />
        <TextButton label={copy.SKIP_TODAY_LABEL} onPress={() => flow.finishAsking('skip')} disabled={busy} />
      </ScreenFooter>
      {celebrating ? (
        <Animated.View entering={fadeIn} style={styles.celebration}>
          <View style={styles.celebrationCenter}>
            <CelebrationCheck announcement={copy.COMPLETE_MESSAGE} />
            <ConfettiBurst />
          </View>
          <Text style={styles.celebrationText}>{copy.COMPLETE_MESSAGE}</Text>
        </Animated.View>
      ) : null}
      <ConfirmDialog
        visible={flow.dialog !== null}
        message={flow.dialogText.message}
        confirmLabel={flow.dialogText.confirm}
        cancelLabel={flow.dialogText.cancel}
        onConfirm={flow.confirmDialog}
        onCancel={flow.cancelDialog}
      />
    </SafeAreaView>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },
    badge: {
      width: typography.h1.lineHeight,
      height: typography.h1.lineHeight,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    ring: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    // Cubre la pantalla durante la celebración: nada se toca mientras se guarda.
    celebration: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xl,
      backgroundColor: colors.background,
    },
    celebrationCenter: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    celebrationText: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
  });
