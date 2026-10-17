import type { TriggerDraftEntry } from '@/features/triggers/trigger.types';

import { draftFingerprint, toRoutineDraft, type RoutineFormState } from './routine.draft';

const base: RoutineFormState = {
  name: 'Salir de casa',
  icon: 'home-outline',
  items: [{ key: 'item-1', id: 'i1', label: 'Llaves', kind: 'carry', critical: true }],
  triggers: [],
};

const fingerprint = (state: RoutineFormState) => draftFingerprint(toRoutineDraft(state));

describe('cambios del borrador de rutina (DC-03)', () => {
  it('el mismo contenido da la misma huella aunque cambien las claves de React', () => {
    expect(fingerprint({ ...base, items: [{ ...base.items[0], key: 'item-99' }] })).toBe(fingerprint(base));
  });

  it('editar y volver al texto original no cuenta como cambio', () => {
    const edited = { ...base, name: 'Salir' };
    expect(fingerprint(edited)).not.toBe(fingerprint(base));
    expect(fingerprint({ ...edited, name: 'Salir de casa' })).toBe(fingerprint(base));
  });

  it('un ítem marcado como crítico, uno nuevo o un aviso nuevo son cambios', () => {
    const trigger: TriggerDraftEntry = { key: 't1', type: 'schedule', time: { hour: 7, minute: 0 }, days: [1] };
    expect(fingerprint({ ...base, items: [{ ...base.items[0], critical: false }] })).not.toBe(fingerprint(base));
    expect(fingerprint({ ...base, items: [...base.items, { label: '', kind: 'carry', critical: false }] })).not.toBe(
      fingerprint(base),
    );
    expect(fingerprint({ ...base, triggers: [trigger] })).not.toBe(fingerprint(base));
  });

  it('el borrador no guarda la clave de React', () => {
    expect(toRoutineDraft(base).items[0]).toEqual({ id: 'i1', label: 'Llaves', kind: 'carry', critical: true });
  });
});
