import type { Item } from '@/shared/types/item.types';

import { toChecklistItems } from './checklist.items';
import { firstUncheckedCritical, summarize } from './checklist.outcome';
import { fromSummaryParams, toSummaryParams } from './summaryParams';

const item = (id: string, label: string, critical = false, note: string | null = null): Item => ({
  id,
  routineId: 'r1',
  label,
  icon: null,
  type: 'carry',
  critical,
  note,
  sortOrder: 0,
  updatedAt: '2026-10-01T00:00:00.000Z',
});

describe('verificación con ítems críticos (P07)', () => {
  const items = toChecklistItems([item('a', 'Billetera'), item('b', 'Estufa apagada', true, ' Perilla a la izquierda '), item('c', 'Llaves', true)]);

  it('los críticos suben y la nota viaja con el ítem', () => {
    expect(items.map((entry) => entry.label)).toEqual(['Estufa apagada', 'Llaves', 'Billetera']);
    expect(items[0].note).toBe('Perilla a la izquierda');
    expect(items[2].note).toBeNull();
  });

  it('DC-02 se pide por el primer crítico sin marcar', () => {
    expect(firstUncheckedCritical(items)?.label).toBe('Estufa apagada');
    expect(firstUncheckedCritical(items.map((entry) => ({ ...entry, checked: entry.critical })))).toBeUndefined();
  });

  it('omitir un crítico deja la verificación parcial y lo marca en el resumen (CF-02)', () => {
    const checked = items.map((entry) => ({ ...entry, checked: entry.label !== 'Estufa apagada' }));
    const summary = summarize(checked, 'done', 12);
    expect(summary).toMatchObject({
      outcome: 'partial',
      checked: 2,
      total: 3,
      omittedLabels: ['Estufa apagada'],
      omittedCriticalLabels: ['Estufa apagada'],
    });
    expect(fromSummaryParams(toSummaryParams('r1', summary))).toEqual(summary);
  });
});
