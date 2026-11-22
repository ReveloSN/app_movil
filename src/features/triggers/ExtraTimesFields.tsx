import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { TimeField } from '@/components/molecules/TimeField';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { ClockTime } from '@/shared/types/clock.types';
import { formatClock } from '@/shared/utils/formatClock';

import copy from './trigger.copy';

interface ExtraTimesFieldsProps {
  /** Horas además de la primera; cada una será su propio aviso. */
  times: readonly ClockTime[];
  canAdd: boolean;
  /** Cuántas horas más caben en la rutina (se muestra al acercarse al límite). */
  remaining: number;
  onAdd(): void;
  onChange(index: number, time: ClockTime): void;
  onRemove(index: number): void;
}

/** Horas extra del aviso por horario (06-2): se añaden aquí en vez de abrir P06 una vez por hora. */
export function ExtraTimesFields({ times, canAdd, remaining, onAdd, onChange, onRemove }: ExtraTimesFieldsProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.group}>
      {times.map((time, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.field}>
            <TimeField
              label={copy.extraTimeLabel(index + 2)}
              value={time}
              valueLabel={formatClock(time)}
              onChange={(next) => onChange(index, next)}
            />
          </View>
          <IconButton
            icon="trash-outline"
            tone="danger"
            accessibilityLabel={copy.removeTimeLabel(formatClock(time))}
            onPress={() => onRemove(index)}
          />
        </View>
      ))}
      {canAdd ? <SecondaryButton icon="add" label={copy.ADD_TIME_LABEL} onPress={onAdd} /> : null}
      {remaining <= 5 && remaining > 0 ? <Text style={styles.hint}>{copy.timesLimitHint(remaining)}</Text> : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: { gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    field: { flex: 1 },
    hint: { ...typography.label, color: colors.textSecondary },
  });
