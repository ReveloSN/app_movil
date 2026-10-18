import { TAB_NAMES } from './lastTab.store';
import { TABS, tabScreenOptions } from './tabs.config';

describe('configuración de las pestañas', () => {
  it('Rutinas, Historial y Ajustes, en ese orden y con sus rutas', () => {
    expect(TABS.map((tab) => [tab.name, tab.title])).toEqual([
      ['index', 'Rutinas'],
      ['history', 'Historial'],
      ['settings', 'Ajustes'],
    ]);
    expect(TABS.map((tab) => tab.name)).toEqual([...TAB_NAMES]);
  });

  it('cada pestaña tiene ícono activo e inactivo distintos', () => {
    TABS.forEach((tab) => expect(tab.activeIcon).not.toBe(tab.icon));
  });

  it('por defecto: deslizar activo, carga perezosa y con animación', () => {
    expect(tabScreenOptions({ keyboardVisible: false, locked: false, reducedMotion: false })).toEqual({
      swipeEnabled: true,
      animationEnabled: true,
      lazy: true,
    });
  });

  it('con el teclado abierto o durante un gesto horizontal propio no se desliza', () => {
    expect(tabScreenOptions({ keyboardVisible: true, locked: false, reducedMotion: false }).swipeEnabled).toBe(false);
    expect(tabScreenOptions({ keyboardVisible: false, locked: true, reducedMotion: false }).swipeEnabled).toBe(false);
  });

  it('con "Quitar animaciones" el cambio es instantáneo', () => {
    expect(tabScreenOptions({ keyboardVisible: false, locked: false, reducedMotion: true }).animationEnabled).toBe(false);
  });
});
