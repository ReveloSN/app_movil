import type { IoniconName } from '@/shared/utils/ioniconName';

import type { TriggerDraft } from '../trigger.types';

/**
 * Contrato común de un tipo de aviso (patrón Strategy). Agregar un tipo nuevo = una estrategia
 * nueva en esta carpeta + registrarla en index.ts; nadie más cambia.
 */
export interface TriggerStrategy<D extends TriggerDraft = TriggerDraft> {
  kind: D['type'];
  /** Opción del selector de tipo (06-1). */
  label: string;
  icon: IoniconName;
  /** Leer el SSID exige permiso de ubicación. */
  needsLocation: boolean;
  /** Fragmento de la frase resumen (06-6): "cuando salgas de Casa". */
  describe(draft: D): string;
  /** Primera frase del cuerpo de la notificación: "Son las 6:00 p. m." */
  notificationLead(draft: D): string;
  /** Momentos en que debe sonar dentro de [from, until). Vacío si no depende del reloj. */
  occurrencesBetween(draft: D, from: Date, until: Date): Date[];
  /**
   * true si el cambio de red dispara el aviso. `previousSsid`/`currentSsid` son null cuando
   * no se estaba / no se está en un Wi-Fi.
   */
  firesOnNetworkChange(draft: D, previousSsid: string | null, currentSsid: string | null, at: Date): boolean;
}
