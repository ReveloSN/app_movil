import type { IoniconName } from '@/shared/utils/ioniconName';

import { TAB_NAMES, type TabName } from './lastTab.store';

export interface TabConfig {
  /** Nombre de la ruta de Expo Router dentro de (tabs). */
  name: TabName;
  /** Título de la pestaña y del encabezado (glosario: Rutinas, Historial, Ajustes). */
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const BY_NAME: Record<TabName, Omit<TabConfig, 'name'>> = {
  index: { title: 'Rutinas', icon: 'list-outline', activeIcon: 'list' },
  history: { title: 'Historial', icon: 'time-outline', activeIcon: 'time' },
  settings: { title: 'Ajustes', icon: 'settings-outline', activeIcon: 'settings' },
};

/** Pestañas en el orden del Documento de Navegación: Rutinas, Historial, Ajustes. */
export const TABS: readonly TabConfig[] = TAB_NAMES.map((name) => ({ name, ...BY_NAME[name] }));

export const tabConfig = (name: string): TabConfig | undefined => TABS.find((tab) => tab.name === name);

export interface TabSwipeConditions {
  keyboardVisible: boolean;
  /** Una pantalla está en su propio gesto horizontal (ej. filtros del historial). */
  locked: boolean;
  reducedMotion: boolean;
}

/**
 * Opciones del paginador de pestañas. Deslizar sigue al dedo, salvo con el teclado abierto o durante un
 * gesto horizontal propio; con "Quitar animaciones", tocar una pestaña cambia al instante. Las pestañas
 * no visitadas no se montan hasta que se necesitan. No hay vuelta: de Ajustes no se pasa a Rutinas.
 */
export function tabScreenOptions({ keyboardVisible, locked, reducedMotion }: TabSwipeConditions) {
  return {
    swipeEnabled: !keyboardVisible && !locked,
    animationEnabled: !reducedMotion,
    lazy: true,
  };
}
