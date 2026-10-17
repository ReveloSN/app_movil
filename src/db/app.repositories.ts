import { supabase } from '@/shared/lib/supabase';

import { createHomeNetworkRepository } from './repositories/home-network.repository';
import { createItemRepository } from './repositories/item.repository';
import { createRoutineTemplateRepository } from './repositories/routine-template.repository';
import { createRoutineRepository } from './repositories/routine.repository';
import { createSettingsRepository } from './repositories/settings.repository';
import { createTriggerRepository } from './repositories/trigger.repository';
import { createVerificationRecordRepository } from './repositories/verification-record.repository';

/**
 * Raíz de composición de lo remoto: único lugar que conecta los repositorios con Supabase.
 * La app lee y escribe en la copia local (features/local-data); esto lo usan el historial (que sigue
 * siendo remoto) y, en la Fase 4, la sincronización.
 */
export const remoteRepositories = {
  routines: createRoutineRepository(supabase),
  items: createItemRepository(supabase),
  triggers: createTriggerRepository(supabase),
  records: createVerificationRecordRepository(supabase),
  templates: createRoutineTemplateRepository(supabase),
  settings: createSettingsRepository(supabase),
  homeNetworks: createHomeNetworkRepository(supabase),
};

export type RemoteRepositories = typeof remoteRepositories;
