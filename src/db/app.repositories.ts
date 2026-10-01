import { supabase } from '@/shared/lib/supabase';

import { createHomeNetworkRepository } from './repositories/home-network.repository';
import { createItemRepository } from './repositories/item.repository';
import { createRoutineTemplateRepository } from './repositories/routine-template.repository';
import { createRoutineRepository } from './repositories/routine.repository';
import { createSettingsRepository } from './repositories/settings.repository';
import { createTriggerRepository } from './repositories/trigger.repository';
import { createVerificationRecordRepository } from './repositories/verification-record.repository';

/**
 * Raíz de composición: único lugar que conecta los repositorios con el cliente real.
 * Hooks y servicios deben recibir el repositorio que necesitan (inyección), no importarlo de aquí.
 */
export const appRepositories = {
  routines: createRoutineRepository(supabase),
  items: createItemRepository(supabase),
  triggers: createTriggerRepository(supabase),
  records: createVerificationRecordRepository(supabase),
  templates: createRoutineTemplateRepository(supabase),
  settings: createSettingsRepository(supabase),
  homeNetworks: createHomeNetworkRepository(supabase),
};

export type AppRepositories = typeof appRepositories;
