import * as Crypto from 'expo-crypto';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { DayPicker, type DayOption } from '@/components/molecules/DayPicker';
import { RadioCardGroup, type RadioCardOption } from '@/components/molecules/RadioCardGroup';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { TimeField } from '@/components/molecules/TimeField';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { UnsavedChangesDialog } from '@/features/forms/UnsavedChangesDialog';
import { useCloseAfterSave } from '@/features/forms/useCloseAfterSave';
import { useAfterAppear } from '@/features/navigation/useAfterAppear';
import { NetworkDetection } from '@/features/triggers/NetworkDetection';
import { strategyFor, strategyForKind, TRIGGER_KINDS } from '@/features/triggers/strategies';
import * as copy from '@/features/triggers/trigger.copy';
import type { TriggerKind } from '@/features/triggers/trigger.types';
import { NETWORK_NAME_MAX_LENGTH, SSID_MAX_LENGTH } from '@/features/triggers/trigger.validation';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';
import { useTriggerForm } from '@/features/triggers/useTriggerForm';
import { useCurrentWifi } from '@/features/triggers/wifi/useCurrentWifi';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { listItemEntering } from '@/shared/theme/motion';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatClock } from '@/shared/utils/formatClock';

// 06-1: reloj para Horario; Wi-Fi con salida o llegada para los avisos por red (mismos textos de siempre).
const KIND_ICONS: Record<TriggerKind, Pick<RadioCardOption<TriggerKind>, 'icon' | 'badgeIcon'>> = {
  schedule: { icon: 'time-outline' },
  wifi_exit: { icon: 'wifi-outline', badgeIcon: 'exit-outline' },
  wifi_enter: { icon: 'wifi-outline', badgeIcon: 'enter-outline' },
};
const KIND_OPTIONS = TRIGGER_KINDS.map((kind) => ({ value: kind, label: strategyForKind(kind).label, ...KIND_ICONS[kind] }));
const DAY_OPTIONS: DayOption[] = copy.WEEK_ORDER.map((day) => ({
  value: day,
  short: copy.DAY_LETTERS[day],
  name: copy.DAY_NAMES[day],
}));

const openLocationPermission = () => router.push({ pathname: '/routine/permissions', params: { kind: 'location' } });

/** P06. Se entra desde P04 con `formId` (y `key` para editar). Guardar devuelve el aviso a P04. */
export default function TriggerScreen() {
  const { formId = '', key } = useLocalSearchParams<{ formId?: string; key?: string }>();
  const styles = useThemedStyles(createStyles);
  const { find, upsert } = useTriggerDrafts(formId);
  // Aviso a editar, o la sugerencia (ej. de una plantilla) con la que se precarga.
  const [existing] = useState(() => find(key));
  const [entryKey] = useState(() => existing?.key ?? Crypto.randomUUID());

  const form = useTriggerForm({
    initial: existing,
    onCommit: (draft) => {
      const entry = { ...draft, key: entryKey };
      upsert(entry);
      // Vuelve a P04 (o al paso del onboarding) con la frase resumen del aviso (06-6) como aviso breve.
      guard.close(copy.summarySentence(strategyFor(entry).describe(entry)));
    },
    onNeedPermission: (kind) => router.push({ pathname: '/routine/permissions', params: { kind } }),
  });
  // DC-03 al salir de P06 con cambios sin guardar, y el cierre tras guardar.
  const guard = useCloseAfterSave(form.dirty, 'back');
  const { detection, detect } = useCurrentWifi();
  const isWifi = form.kind !== 'schedule';
  const networkNameRef = useRef<TextInput>(null);
  const { resume } = form;

  // Flujo C: al volver de P02 se retoma el guardado con todo lo que ya estaba llenado. Espera a que
  // P02 termine de cerrarse: guardar cierra P06 y dos cierres encadenados hacen fallar a Android.
  useAfterAppear(() => void resume());

  // La red se vuelve a leer al entrar y al volver (de P02 o de los ajustes del sistema).
  useFocusEffect(
    useCallback(() => {
      if (isWifi) void detect();
    }, [isWifi, detect]),
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 06-1 */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Tipo
        </Text>
        <RadioCardGroup<TriggerKind>
          accessibilityLabel="Tipo de aviso"
          options={KIND_OPTIONS}
          value={form.kind}
          onChange={form.setKind}
        />

        {/* Al cambiar de tipo, lo de debajo entra con una transición breve (sigue "Quitar animaciones"). */}
        <Animated.View key={isWifi ? 'wifi' : 'schedule'} entering={listItemEntering} style={styles.kindFields}>
          {isWifi ? (
            <>
              {/* 06-3 + 06-4 */}
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Red
              </Text>
              <NetworkDetection
                detection={detection}
                onDetect={detect}
                onRequestPermission={openLocationPermission}
                onUse={(ssid) => form.setSsid(ssid)}
              />
              <TextField
                label="Nombre de la red Wi-Fi"
                placeholder="Como aparece en tu teléfono"
                value={form.ssid}
                onChangeText={form.setSsid}
                maxLength={SSID_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
                error={form.errors.ssid}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => networkNameRef.current?.focus()}
              />
              <TextField
                ref={networkNameRef}
                returnKeyType="done"
                label="¿Cómo la llamas?"
                placeholder="Ej. Casa"
                value={form.networkName}
                onChangeText={form.setNetworkName}
                maxLength={NETWORK_NAME_MAX_LENGTH}
                showCounter
                error={form.errors.networkName}
              />

              {/* 06-5 */}
              <SwitchRow
                icon="time-outline"
                label={copy.WINDOW_SWITCH_LABEL}
                value={form.windowEnabled}
                onValueChange={form.setWindowEnabled}
              />
              {form.windowEnabled ? (
                <View style={styles.group}>
                  <TimeField
                    label="Desde"
                    value={form.timeWindow.start}
                    valueLabel={formatClock(form.timeWindow.start)}
                    onChange={(start) => form.setTimeWindow((current) => ({ ...current, start }))}
                  />
                  <TimeField
                    label="Hasta"
                    value={form.timeWindow.end}
                    valueLabel={formatClock(form.timeWindow.end)}
                    onChange={(end) => form.setTimeWindow((current) => ({ ...current, end }))}
                  />
                  {form.errors.window ? <StatusMessage tone="error" message={form.errors.window} /> : null}
                </View>
              ) : null}
            </>
          ) : (
            <>
              {/* 06-2 */}
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Hora y días
              </Text>
              <TimeField label="Hora" value={form.time} valueLabel={formatClock(form.time)} onChange={form.setTime} />
              <DayPicker options={DAY_OPTIONS} value={form.days} onChange={form.setDays} />
              {form.errors.days ? <StatusMessage tone="error" message={form.errors.days} /> : null}
            </>
          )}
        </Animated.View>

        {/* 06-6 */}
        <View style={styles.summary} accessibilityLiveRegion="polite">
          <Text style={styles.summaryText}>{form.summary}</Text>
        </View>

      </ScrollView>
      {/* Primaria en la zona del pulgar, fija como en P04. */}
      <ScreenFooter bordered>
        {form.permissionError ? <StatusMessage tone="error" message={form.permissionError} /> : null}
        <PrimaryButton label={copy.SAVE_TRIGGER_LABEL} onPress={form.save} loading={form.saving} />
      </ScreenFooter>
      <UnsavedChangesDialog
        visible={guard.confirming}
        onSave={() => {
          guard.dismiss();
          // Valida y pide permisos igual que el botón: si algo falta, se queda en P06.
          void form.save();
        }}
        onDiscard={guard.discard}
        onDismiss={guard.dismiss}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    group: {
      gap: spacing.md,
    },
    // Mismo ritmo que el resto del formulario.
    kindFields: {
      gap: spacing.lg,
      // 24 dp entre el selector de tipo y la sección siguiente (16 del formulario + 8).
      marginTop: spacing.sm,
    },
    summary: {
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.primaryTint,
    },
    summaryText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
  });
