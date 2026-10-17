import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/atoms/PressableScale';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { ClockTime } from '@/shared/types/clock.types';

interface TimeFieldProps {
  label: string;
  value: ClockTime;
  /** Hora ya formateada para mostrar (ej. "6:00 p. m."). */
  valueLabel: string;
  onChange(value: ClockTime): void;
}

const toDate = ({ hour, minute }: ClockTime) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

const fromDate = (date: Date): ClockTime => ({ hour: date.getHours(), minute: date.getMinutes() });

/** Campo de hora: en Android abre el reloj del sistema; en iOS despliega la rueda debajo. */
export function TimeField({ label, value, valueLabel, onChange }: TimeFieldProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [iosOpen, setIosOpen] = useState(false);

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'time',
        is24Hour: false,
        onValueChange: (_event, date) => onChange(fromDate(date)),
      });
    } else {
      setIosOpen((current) => !current);
    }
  }

  return (
    <View style={styles.container}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${valueLabel}`}
        accessibilityHint="Cambia la hora"
        onPress={open}
        style={styles.field}
      >
        <Ionicons name="time-outline" size={iconSizes.md} color={colors.textMuted} />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueLabel}</Text>
      </PressableScale>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          display="spinner"
          onValueChange={(_event, date) => onChange(fromDate(date))}
        />
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: sizes.checklistRowHeight,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.card,
    },
    label: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    value: {
      ...typography.bodyStrong,
      color: colors.primary,
    },
  });
