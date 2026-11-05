import { router } from 'expo-router';
import { memo } from 'react';

import { RoutineCard } from '@/components/molecules/RoutineCard';
import { VERIFY_AGAIN_LABEL, VERIFY_PRESS_HINT, editRoutineLabel } from '@/features/home/home.copy';
import { VERIFY_NOW_LABEL } from '@/features/checklist/checklist.copy';
import { routineAccent } from '@/features/routines/routine-appearance';
import { canVerifyFromHome } from '@/features/routines/routine-list';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Routine } from '@/shared/types/routine.types';

interface RoutineCardItemProps {
  routine: Routine;
  /** Ya se verificó hoy (un booleano, no la hora: así la tarjeta no se redibuja cada minuto). */
  completedToday: boolean;
}

/**
 * Tarjeta de rutina de Inicio con sus acciones. Memoizada: el reloj de Inicio y los cambios ajenos no la
 * redibujan. Las de llegada no se verifican desde aquí (ensuciaría el historial de salidas): solo se editan.
 */
function RoutineCardItemBase({ routine, completedToday }: RoutineCardItemProps) {
  const { colors } = useAppTheme();
  const accent = routineAccent(colors, routine.color);
  const verifiable = canVerifyFromHome(routine);
  const verify = () => router.push({ pathname: '/routine/[id]/verify', params: { id: routine.id } });
  return (
    <RoutineCard
      name={routine.name}
      icon={routine.icon}
      accentColor={accent.color}
      accentTint={accent.tint}
      active={routine.active}
      lastCompletedAt={routine.lastCompletedAt}
      completedToday={completedToday}
      actionLabel={verifiable ? (completedToday ? VERIFY_AGAIN_LABEL : VERIFY_NOW_LABEL) : undefined}
      onAction={verifiable ? verify : undefined}
      // Documento 3, P03: el cuerpo verifica; editar es el botón de lápiz.
      onPress={verifiable ? verify : undefined}
      pressHint={VERIFY_PRESS_HINT}
      onEdit={() => router.push({ pathname: '/routine/[id]/edit', params: { id: routine.id } })}
      editLabel={editRoutineLabel(routine.name)}
    />
  );
}

export const RoutineCardItem = memo(RoutineCardItemBase);
