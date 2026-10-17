import type { Json } from '@/shared/types/json.types';
import type { VerificationRecord } from '@/shared/types/verification-record.types';

/** 09-3: filtro de la pestaña (no se guarda). null = todas. */
export interface HistoryFilter {
  routineId: string | null;
  result: string | null;
}

export const NO_FILTER: HistoryFilter = { routineId: null, result: null };

export const filterRecords = <T extends VerificationRecord>(records: readonly T[], { routineId, result }: HistoryFilter): T[] =>
  records.filter((record) => (!routineId || record.routineId === routineId) && (!result || record.result === result));

/** Ítem de records.items_checked (copia del ítem al verificar). */
export interface CheckedItem {
  label: string;
  critical: boolean;
  checked: boolean;
}

/** Lee items_checked de forma tolerante (es jsonb: puede venir de otra versión o de otro dispositivo). */
export function parseCheckedItems(value: Json | null): CheckedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const { label, critical, checked } = entry;
    return typeof label === 'string' && label.trim()
      ? [{ label: label.trim(), critical: critical === true, checked: checked === true }]
      : [];
  });
}

export interface SkippedItem {
  label: string;
  count: number;
}

const normalize = (label: string) => label.toLocaleLowerCase('es');

/**
 * 09-4: los ítems que más se dejan sin marcar (como mucho 3). Cuentan las verificaciones con ítems
 * (las omitidas desde la notificación no los traen). Empates: el que se omitió más recientemente.
 */
export function mostSkippedItems(records: readonly VerificationRecord[], limit = 3): SkippedItem[] {
  const byLabel = new Map<string, SkippedItem & { last: number }>();
  for (const record of records) {
    const at = Date.parse(record.date) || 0;
    for (const item of parseCheckedItems(record.itemsChecked)) {
      if (item.checked) continue;
      const key = normalize(item.label);
      const current = byLabel.get(key);
      if (current) {
        current.count += 1;
        if (at > current.last) Object.assign(current, { last: at, label: item.label });
      } else {
        byLabel.set(key, { label: item.label, count: 1, last: at });
      }
    }
  }
  return [...byLabel.values()]
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, limit)
    .map(({ label, count }) => ({ label, count }));
}
