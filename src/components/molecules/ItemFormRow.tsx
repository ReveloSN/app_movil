import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import { IconButton } from '@/components/atoms/IconButton';
import { TextField } from '@/components/atoms/TextField';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { SegmentedControl, type SegmentOption } from './SegmentedControl';
import { SwitchRow } from './SwitchRow';

interface ItemFormRowProps<T extends string> {
  /** Posición (0-based) para la etiqueta "Ítem N". */
  index: number;
  label: string;
  labelMaxLength: number;
  labelError?: string;
  onChangeLabel(label: string): void;
  type: T;
  typeOptions: readonly SegmentOption<T>[];
  onChangeType(type: T): void;
  critical: boolean;
  onChangeCritical(critical: boolean): void;
  /** Si es false no se muestra el botón eliminar (ej. último ítem). */
  removable: boolean;
  onRemove(): void;
}

/** Fila editable de un ítem en el formulario de rutina. Solo props: no guarda nada. */
export function ItemFormRow<T extends string>({
  index,
  label,
  labelMaxLength,
  labelError,
  onChangeLabel,
  type,
  typeOptions,
  onChangeType,
  critical,
  onChangeCritical,
  removable,
  onRemove,
}: ItemFormRowProps<T>) {
  const styles = useThemedStyles(createStyles);
  const position = index + 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Ítem {position}
        </Text>
        {critical ? <Chip tone="critical" label="Crítico" /> : null}
        <View style={styles.spacer} />
        {removable ? (
          <IconButton icon="trash-outline" tone="danger" accessibilityLabel={`Eliminar ítem ${position}`} onPress={onRemove} />
        ) : null}
      </View>
      <TextField
        label="¿Qué es?"
        placeholder="Ej. Llaves"
        value={label}
        onChangeText={onChangeLabel}
        maxLength={labelMaxLength}
        showCounter
        error={labelError}
      />
      <SegmentedControl accessibilityLabel={`Tipo del ítem ${position}`} options={typeOptions} value={type} onChange={onChangeType} />
      <SwitchRow icon="flag-outline" label="Marcar como crítico" value={critical} onValueChange={onChangeCritical} />
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: sizes.secondaryRowHeight,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    spacer: {
      flex: 1,
    },
  });
