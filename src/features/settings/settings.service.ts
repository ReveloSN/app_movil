import type { SettingsRepository } from '@/db/repositories/settings.repository';
import type { Settings } from '@/shared/types/settings.types';

/** Fila de ajustes del usuario; si aún no existe, la crea con los valores por defecto de la tabla. */
export async function loadOrCreateSettings(repository: Pick<SettingsRepository, 'getAll' | 'create'>): Promise<Settings> {
  const [row] = await repository.getAll();
  return row ?? repository.create({});
}
