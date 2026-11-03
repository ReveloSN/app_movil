import { supabase } from '@/shared/lib/supabase';

import { createForgotEventRepository } from './repositories/forgot-event.repository';
import { createHomeNetworkRepository } from './repositories/home-network.repository';
import { createItemRepository } from './repositories/item.repository';
import { createRoutineTemplateRepository } from './repositories/routine-template.repository';
import { createRoutineRepository } from './repositories/routine.repository';
import { createSettingsRepository } from './repositories/settings.repository';
import { createTriggerRepository } from './repositories/trigger.repository';
import { createVerificationRecordRepository } from './repositories/verification-record.repository';

/**
 * Raíz de composición de lo remoto: único lugar que conecta los repositorios con Supabase.
 * La app lee y escribe solo en la copia local (db/local), historial y olvidos incluidos; esto lo usa
 * únicamente la sincronización (SyncProvider y la subida desde la tarea en segundo plano).
 */
export const remoteRepositories = {
  routines: createRoutineRepository(supabase),
  items: createItemRepository(supabase),
  triggers: createTriggerRepository(supabase),
  records: createVerificationRecordRepository(supabase),
  forgotEvents: createForgotEventRepository(supabase),
  templates: createRoutineTemplateRepository(supabase),
  settings: createSettingsRepository(supabase),
  homeNetworks: createHomeNetworkRepository(supabase),
};

export type RemoteRepositories = typeof remoteRepositories;
