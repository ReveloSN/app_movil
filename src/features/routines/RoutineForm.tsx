import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { TextField } from '@/components/atoms/TextField';
import { ColorPicker } from '@/components/molecules/ColorPicker';
import { IconPicker } from '@/components/molecules/IconPicker';
import { ItemSummaryRow } from '@/components/molecules/ItemSummaryRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { AiDraftNotice } from '@/features/ai/AiDraftNotice';
import { UnsavedChangesDialog } from '@/features/forms/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '@/features/forms/useUnsavedChangesGuard';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { RoutineTriggersSection } from '@/features/triggers/RoutineTriggersSection';
import { strategyFor } from '@/features/triggers/strategies';
import { routineSavedMessage } from '@/features/triggers/trigger.copy';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';
import { showFlashMessage } from '@/shared/events/flashMessage';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Routine } from '@/shared/types/routine.types';

import { resolveItemIcon } from './item-icons';
import { ItemSuggestions } from './ItemSuggestions';
import { resolveRoutineColor, resolveRoutineIcon, ROUTINE_COLORS, ROUTINE_ICONS } from './routine-appearance';
import * as copy from './routine.copy';
import type { RoutineOriginal } from './routine-edit.service';
import { ItemEditSheet } from './ItemEditSheet';
import { MAX_ITEMS, MAX_ITEMS_MESSAGE, ROUTINE_NAME_MAX_LENGTH } from './routine.validation';
import type { RoutineDraft } from './routines.types';
import { useRoutineDeletion } from './useRoutineDeletion';
import { useRoutineForm, type ItemFormEntry } from './useRoutineForm';
import { useRoutines } from './useRoutines';

interface RoutineFormProps {
  /** Identifica los avisos en edición de este formulario (los comparte con P06). */
  formId: string;
  initialDraft?: RoutineDraft;
  /** Modo edición: rutina guardada y lo que tenía al abrir. Sin esto, se crea una nueva. */
  editing?: { routine: Routine; original: RoutineOriginal };
  /**
   * Borrador hecho con IA: se marca "Sugerido con IA" y cuenta como cambio sin guardar desde el inicio
   * (salir pregunta DC-03). Aparte se dice si sugirió un aviso por Wi-Fi (la red la elige la persona).
   */
  aiAssisted?: { suggestsWifiExit: boolean };
}

const backToRoutines = () => router.dismissTo('/(tabs)');

function cancel() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

/** P04: el mismo formulario crea o edita según reciba `editing`. */
export function RoutineForm({ formId, initialDraft, editing, aiAssisted }: RoutineFormProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const { createRoutine, updateRoutine } = useRoutines();
  const { drafts: triggers, clear: clearTriggers } = useTriggerDrafts(formId);
  const { rearm } = useTriggerRuntime();
  useEffect(() => clearTriggers, [clearTriggers]);

  function handleSaved() {
    guard.allowExit();
    // CF-03 adaptado a los avisos.
    if (triggers.length > 0) {
      showFlashMessage(routineSavedMessage(triggers.map((trigger) => strategyFor(trigger).describe(trigger))));
    }
    // Reprograma en el teléfono: avisos nuevos, cambiados o quitados, y el nombre en las notificaciones.
    if (triggers.length > 0 || editing) {
      rearm().catch((cause: unknown) => {
        if (__DEV__) console.warn('[triggers.rearm]', cause);
      });
    }
    // Vuelve a Inicio también desde Plantillas (flujo B), sin dejar P10 ni P06 en la pila.
    backToRoutines();
  }

  const form = useRoutineForm({
    save: (draft) => (editing ? updateRoutine(editing.routine.id, draft, editing.original) : createRoutine(draft)),
    onSaved: handleSaved,
    initialDraft,
    triggers,
    startDirty: Boolean(aiAssisted),
  });
  // P05: ítem abierto en la hoja inferior (nuevo o existente).
  const [editingItem, setEditingItem] = useState<{ entry: ItemFormEntry; isNew: boolean } | null>(null);
  // DC-03: cubre "Cancelar", el atrás de Android y cualquier navegación que saque de P04.
  const guard = useUnsavedChangesGuard(form.dirty);
  const removal = useRoutineDeletion(editing?.routine.id, () => {
    guard.allowExit();
    backToRoutines();
  });

  function saveFromDialog() {
    guard.dismiss();
    // Si no pasa la validación, se queda en P04 con los errores a la vista.
    void form.submit();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: editing ? copy.EDIT_ROUTINE_TITLE : copy.NEW_ROUTINE_TITLE,
          headerLeft: () => <TextButton label={copy.CANCEL_LABEL} onPress={cancel} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {aiAssisted ? <AiDraftNotice suggestsWifiExit={aiAssisted.suggestsWifiExit} /> : null}
        <TextField
          label="Nombre de la rutina"
          placeholder="Ej. Salir al trabajo"
          value={form.name}
          onChangeText={form.setName}
          maxLength={ROUTINE_NAME_MAX_LENGTH}
          showCounter
          error={form.errors.name}
        />

        {/* 04-2 */}
        <SectionLabel label={copy.ICON_LABEL} />
        <IconPicker
          accessibilityLabel={copy.ICON_LABEL}
          options={ROUTINE_ICONS}
          value={resolveRoutineIcon(form.icon)}
          onChange={form.setIcon}
          accentColor={colors[resolveRoutineColor(form.color).token]}
        />
        <SectionLabel label={copy.COLOR_LABEL} />
        <ColorPicker
          accessibilityLabel={copy.COLOR_LABEL}
          options={ROUTINE_COLORS.map((option) => ({ key: option.key, label: option.label, color: colors[option.token] }))}
          value={resolveRoutineColor(form.color).key}
          onChange={form.setColor}
        />

        <SectionLabel
          label={copy.ITEMS_SECTION_TITLE}
          trailing={`${form.items.length}/${MAX_ITEMS}`}
          accessibilityLabel={`${copy.ITEMS_SECTION_TITLE}, ${form.items.length} de ${MAX_ITEMS}`}
        />
        {form.errors.items ? <StatusMessage tone="error" message={form.errors.items} /> : null}

        {form.items.length === 0 ? <StatusMessage tone="info" message={copy.EMPTY_ITEMS_MESSAGE} /> : null}
        {form.items.map((item, index) => (
          <ItemSummaryRow
            key={item.key}
            label={item.label}
            icon={resolveItemIcon(item.icon).icon}
            critical={item.critical}
            criticalLabel={copy.CRITICAL_LABEL}
            note={item.note}
            error={form.errors.itemLabels?.[index]}
            onPress={() => setEditingItem({ entry: item, isNew: false })}
            editHint={copy.editItemHint(item.label)}
            onRemove={() => form.removeItem(item.key)}
            removeLabel={copy.removeItemLabel(item.label)}
          />
        ))}

        {/* ER-05: al llegar al máximo, se explica por qué ya no se puede añadir. */}
        {form.canAddItem ? null : <StatusMessage tone="info" message={MAX_ITEMS_MESSAGE} />}
        <SecondaryButton
          icon="add"
          label={copy.ADD_ITEM_LABEL}
          onPress={() => setEditingItem({ entry: form.blankItem(), isNew: true })}
          disabled={!form.canAddItem}
        />

        {/* 04-4 */}
        <ItemSuggestions
          name={form.name}
          labels={form.items.map((item) => item.label)}
          canAdd={form.canAddItem}
          onPick={form.addSuggested}
        />

        {/* 04-5 */}
        <RoutineTriggersSection formId={formId} error={form.errors.triggers} />

        {/* 04-7: solo al editar. */}
        {editing ? (
          <View style={styles.deleteZone}>
            {removal.error ? <StatusMessage tone="error" message={removal.error} /> : null}
            <TextButton
              label={copy.DELETE_ROUTINE_LABEL}
              tone="danger"
              onPress={removal.ask}
              disabled={removal.deleting || form.submitting}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {form.submitError ? <StatusMessage tone="error" message={form.submitError} /> : null}
        <PrimaryButton
          label={copy.SAVE_CHANGES_LABEL}
          onPress={form.submit}
          loading={form.submitting}
          disabled={removal.deleting}
        />
      </View>

      {editing ? (
        <ConfirmDialog
          visible={removal.confirming}
          message={copy.deleteRoutineMessage(editing.routine.name)}
          confirmLabel={copy.DELETE_CONFIRM}
          cancelLabel={copy.DELETE_CANCEL}
          onConfirm={removal.confirm}
          onCancel={removal.cancel}
          confirmFirst
        />
      ) : null}
      {editingItem ? (
        <ItemEditSheet
          key={editingItem.entry.key}
          item={editingItem.entry}
          isNew={editingItem.isNew}
          onSave={(entry) => {
            form.saveItem(entry);
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      ) : null}
      <UnsavedChangesDialog
        visible={guard.confirming}
        onSave={saveFromDialog}
        onDiscard={guard.discard}
        onDismiss={guard.dismiss}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    deleteZone: {
      gap: spacing.sm,
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    // Pie fijo con el botón principal, como en el mockup.
    footer: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
  });
