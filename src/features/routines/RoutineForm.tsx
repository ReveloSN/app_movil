import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { TextField } from '@/components/atoms/TextField';
import { ItemFormRow } from '@/components/molecules/ItemFormRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useTriggerRuntime } from '@/features/notifications/TriggerRuntimeProvider';
import { RoutineTriggersSection } from '@/features/triggers/RoutineTriggersSection';
import { strategyFor } from '@/features/triggers/strategies';
import { routineSavedMessage } from '@/features/triggers/trigger.copy';
import { useTriggerDrafts } from '@/features/triggers/TriggerDraftsProvider';
import { showFlashMessage } from '@/shared/events/flashMessage';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Routine } from '@/shared/types/routine.types';

import { ITEM_KIND_OPTIONS } from './item-kinds';
import * as copy from './routine.copy';
import type { RoutineOriginal } from './routine-edit.service';
import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS, ROUTINE_NAME_MAX_LENGTH } from './routine.validation';
import type { RoutineDraft } from './routines.types';
import { useRoutineDeletion } from './useRoutineDeletion';
import { useRoutineForm } from './useRoutineForm';
import { useRoutines } from './useRoutines';

interface RoutineFormProps {
  /** Identifica los avisos en edición de este formulario (los comparte con P06). */
  formId: string;
  initialDraft?: RoutineDraft;
  /** Modo edición: rutina guardada y lo que tenía al abrir. Sin esto, se crea una nueva. */
  editing?: { routine: Routine; original: RoutineOriginal };
}

const backToRoutines = () => router.dismissTo('/(tabs)');

function cancel() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

/** P04: el mismo formulario crea o edita según reciba `editing`. */
export function RoutineForm({ formId, initialDraft, editing }: RoutineFormProps) {
  const styles = useThemedStyles(createStyles);
  const { createRoutine, updateRoutine } = useRoutines();
  const { drafts: triggers, clear: clearTriggers } = useTriggerDrafts(formId);
  const { rearm } = useTriggerRuntime();
  const removal = useRoutineDeletion(editing?.routine.id, backToRoutines);

  useEffect(() => clearTriggers, [clearTriggers]);

  function handleSaved() {
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
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: editing ? copy.EDIT_ROUTINE_TITLE : copy.NEW_ROUTINE_TITLE,
          headerLeft: () => <TextButton label={copy.CANCEL_LABEL} onPress={cancel} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nombre de la rutina"
          placeholder="Ej. Salir al trabajo"
          value={form.name}
          onChangeText={form.setName}
          maxLength={ROUTINE_NAME_MAX_LENGTH}
          showCounter
          error={form.errors.name}
        />

        <SectionLabel
          label={copy.ITEMS_SECTION_TITLE}
          trailing={`${form.items.length}/${MAX_ITEMS}`}
          accessibilityLabel={`${copy.ITEMS_SECTION_TITLE}, ${form.items.length} de ${MAX_ITEMS}`}
        />
        {form.errors.items ? <StatusMessage tone="error" message={form.errors.items} /> : null}

        {form.items.map((item, index) => (
          <ItemFormRow
            key={item.key}
            index={index}
            label={item.label}
            labelMaxLength={ITEM_LABEL_MAX_LENGTH}
            labelError={form.errors.itemLabels?.[index]}
            onChangeLabel={(label) => form.updateItem(item.key, { label })}
            type={item.kind}
            typeOptions={ITEM_KIND_OPTIONS}
            onChangeType={(kind) => form.updateItem(item.key, { kind })}
            critical={item.critical}
            onChangeCritical={(critical) => form.updateItem(item.key, { critical })}
            removable={form.items.length > 1}
            onRemove={() => form.removeItem(item.key)}
          />
        ))}

        <SecondaryButton icon="add" label={copy.ADD_ITEM_LABEL} onPress={form.addItem} disabled={!form.canAddItem} />

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
