import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { TextField } from '@/components/atoms/TextField';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { AiDraftNotice } from '@/features/ai/AiDraftNotice';
import { UnsavedChangesDialog } from '@/features/forms/UnsavedChangesDialog';
import { useUnsavedChangesGuard } from '@/features/forms/useUnsavedChangesGuard';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { RoutineTriggersSection } from '@/features/triggers/RoutineTriggersSection';
import { strategyFor } from '@/features/triggers/strategies';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';
import { UNDO_LABEL } from '@/features/feedback/feedback.copy';
import { useToast } from '@/features/feedback/toast.context';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Routine } from '@/shared/types/routine.types';

import { ItemSuggestions } from './ItemSuggestions';
import { RoutineAppearanceFields } from './RoutineAppearanceFields';
import { RoutineItemsSection } from './RoutineItemsSection';
import { routineAccent } from './routine-appearance';
import { savedRoutineMessage } from './routine-feedback';
import * as copy from './routine.copy';
import type { RoutineOriginal } from './routine-edit.service';
import { ItemEditSheet } from './ItemEditSheet';
import { ROUTINE_NAME_MAX_LENGTH } from './routine.validation';
import type { RoutineDraft } from './routines.types';
import { useFirstErrorFocus } from './useFirstErrorFocus';
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
  const toast = useToast();
  const { scrollRef, nameRef, onItemsLayout, onTriggersLayout, focusFirstError } = useFirstErrorFocus();
  useEffect(() => clearTriggers, [clearTriggers]);

  function handleSaved() {
    guard.allowExit();
    // CF-03 adaptado a los avisos; el aviso sobrevive a la vuelta a Inicio.
    toast.show(savedRoutineMessage(Boolean(editing), triggers.map((trigger) => strategyFor(trigger).describe(trigger))));
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
    toast.show(copy.ROUTINE_DELETED);
    backToRoutines();
  });

  // Quitar no pide confirmación: se hace al instante y el aviso breve permite deshacerlo.
  function removeItem(key: string) {
    const removed = form.removeItem(key);
    if (!removed) return;
    toast.show({
      message: copy.itemRemovedMessage(removed.entry.label),
      tone: 'info',
      action: { label: UNDO_LABEL, onPress: () => form.restoreItem(removed) },
    });
  }

  // Si no pasa la validación, se queda en P04 con los errores a la vista y lleva al primero.
  async function submit() {
    const result = await form.submit();
    if (result?.status === 'invalid') focusFirstError(result.errors);
  }

  function saveFromDialog() {
    guard.dismiss();
    void submit();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: editing ? copy.EDIT_ROUTINE_TITLE : copy.NEW_ROUTINE_TITLE,
          headerLeft: () => <TextButton label={copy.CANCEL_LABEL} onPress={cancel} />,
        }}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {aiAssisted ? <AiDraftNotice suggestsWifiExit={aiAssisted.suggestsWifiExit} /> : null}
        <TextField
          ref={nameRef}
          returnKeyType="done"
          label="Nombre de la rutina"
          placeholder="Ej. Salir al trabajo"
          value={form.name}
          onChangeText={form.setName}
          maxLength={ROUTINE_NAME_MAX_LENGTH}
          showCounter
          error={form.errors.name}
        />

        {/* 04-2 */}
        <RoutineAppearanceFields icon={form.icon} color={form.color} onIconChange={form.setIcon} onColorChange={form.setColor} />

        <RoutineItemsSection
          items={form.items}
          errors={form.errors}
          canAddItem={form.canAddItem}
          onLayout={onItemsLayout}
          onEdit={(entry) => setEditingItem({ entry, isNew: false })}
          onAdd={() => setEditingItem({ entry: form.blankItem(), isNew: true })}
          onRemove={removeItem}
        />

        {/* 04-4 */}
        <ItemSuggestions
          name={form.name}
          labels={form.items.map((item) => item.label)}
          canAdd={form.canAddItem}
          onPick={form.addSuggested}
        />

        {/* 04-5 */}
        <View onLayout={onTriggersLayout}>
          <RoutineTriggersSection formId={formId} error={form.errors.triggers} />
        </View>

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

      <ScreenFooter bordered>
        {form.submitError ? <StatusMessage tone="error" message={form.submitError} /> : null}
        {/* Siempre activo: si falta algo, los errores en línea dicen qué (no un botón "muerto"). */}
        <PrimaryButton
          label={editing ? copy.SAVE_CHANGES_LABEL : copy.CREATE_ROUTINE_LABEL}
          onPress={() => void submit()}
          loading={form.submitting}
          disabled={removal.deleting}
        />
      </ScreenFooter>

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
          accentColor={routineAccent(colors, form.color).color}
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

const createStyles = ({ spacing }: AppTheme) =>
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
  });
