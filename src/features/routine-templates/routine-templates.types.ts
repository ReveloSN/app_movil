import type { ItemDraft } from '@/features/routines/routines.types';
import type { TriggerDraft } from '@/features/triggers/trigger.types';
import type { IoniconName } from '@/shared/utils/ioniconName';

/**
 * Plantilla precargada en el código (no la entidad `templates` de Supabase).
 * `name` e `items` deben cumplir los límites de rutina: se usan tal cual como borrador.
 */
export interface PresetTemplate {
  id: string;
  name: string;
  /** Máx. 70 caracteres. */
  description: string;
  icon: IoniconName;
  items: readonly ItemDraft[];
  /** Texto del aviso sugerido en la tarjeta (P10). */
  suggestedTrigger: string;
  /**
   * El mismo aviso, listo para precargar P06 (onboarding). null = "Manual": sin aviso.
   * Los de Wi-Fi traen el nombre de la red pero no el SSID: se detecta en P06.
   */
  suggestedTriggerDraft: TriggerDraft | null;
}
