import type { Json } from '@/shared/types/json.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

import { filterRecords, mostSkippedItems, parseCheckedItems } from './history.filter';

const entry = (label: string, checked: boolean, critical = false) => ({ itemId: label, label, critical, checked });

const rec = (id: string, routineId: string, result: string, date: string, items: Json | null = null): VerificationRecord => ({
  id,
  routineId,
  date,
  result,
  itemsChecked: items,
  durationSeconds: 10,
});

const records = [
  rec('1', 'r1', 'partial', '2026-10-10T08:00:00.000Z', [entry('Cargador', false), entry('Llaves', true)]),
  rec('2', 'r1', 'partial', '2026-10-11T08:00:00.000Z', [entry('cargador', false), entry('Gafas', false)]),
  rec('3', 'r2', 'completed', '2026-10-12T08:00:00.000Z', [entry('Estufa', true, true)]),
  rec('4', 'r2', 'partial', '2026-10-13T08:00:00.000Z', [entry('Estufa', false, true), entry('Gafas', false)]),
  rec('5', 'r2', 'skipped', '2026-10-14T08:00:00.000Z'),
];

describe('filtro del historial (09-3)', () => {
  it('por rutina, por resultado o ambos', () => {
    expect(filterRecords(records, { routineId: 'r1', result: null }).map((r) => r.id)).toEqual(['1', '2']);
    expect(filterRecords(records, { routineId: null, result: 'partial' }).map((r) => r.id)).toEqual(['1', '2', '4']);
    expect(filterRecords(records, { routineId: 'r2', result: 'skipped' }).map((r) => r.id)).toEqual(['5']);
    expect(filterRecords(records, { routineId: null, result: null })).toHaveLength(5);
  });
});

describe('más omitidos (09-4)', () => {
  it('los 3 ítems sin marcar más frecuentes, sin distinguir mayúsculas', () => {
    expect(mostSkippedItems(records)).toEqual([
      { label: 'Gafas', count: 2 },
      { label: 'cargador', count: 2 },
      { label: 'Estufa', count: 1 },
    ]);
  });

  it('sin ítems omitidos no hay lista', () => {
    expect(mostSkippedItems([records[2], records[4]])).toEqual([]);
  });
});

describe('items_checked', () => {
  it('se lee de forma tolerante', () => {
    expect(parseCheckedItems([entry('Llaves', true), { label: '' }, 'x', null] as Json)).toEqual([
      { label: 'Llaves', critical: false, checked: true },
    ]);
    expect(parseCheckedItems(null)).toEqual([]);
  });
});
