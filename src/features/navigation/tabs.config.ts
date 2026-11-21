import type { IoniconName } from '@/shared/utils/ioniconName';

import { TAB_NAMES, type TabName } from './lastTab.store';
import tabsCopy from './tabs.copy';

export interface TabConfig {
  /** Nombre de la ruta de Expo Router dentro de (tabs). */
  name: TabName;
  /** Título de la pestaña y del encabezado (glosario: Rutinas, Historial, Ajustes). */
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

const ICONS: Record<TabName, Pick<TabConfig, 'icon' | 'activeIcon'>> = {
  index: { icon: 'list-outline', activeIcon: 'list' },
  history: { icon: 'time-outline', activeIcon: 'time' },
  settings: { icon: 'settings-outline', activeIcon: 'settings' },
};

/** Pestañas en el orden del Documento de Navegación: Rutinas, Historial, Ajustes. */
export const TABS: readonly TabConfig[] = TAB_NAMES.map((name) => ({
  name,
  // Getter: el título se lee al usarlo, con el idioma activo en ese momento.
  get title() {
    return tabsCopy[name];
  },
  ...ICONS[name],
}));

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
