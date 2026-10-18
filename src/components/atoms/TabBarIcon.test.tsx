import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';
import { contrastRatio } from '@/shared/theme/contrast';
import { palettes } from '@/shared/theme/tokens';

import { TabBarIcon } from './TabBarIcon';

jest.setTimeout(20000);

// Celda que React Navigation da al ícono de cada pestaña (material): 24×24.
const CELL = 24;

async function renderIcon(focused: boolean) {
  await render(
    <TestProviders>
      <TabBarIcon icon="list-outline" activeIcon="list" focused={focused} color="#096B4C" size={CELL} />
    </TestProviders>,
  );
}

/** Ancho que le queda al ícono dentro de la celda tras el padding de su contenedor. */
function widthLeftForIcon() {
  const cell = StyleSheet.flatten(screen.getByTestId('tab-icon-cell').props.style);
  const padding = Number(cell.paddingHorizontal ?? cell.padding ?? 0) * 2 + Number(cell.paddingLeft ?? 0) + Number(cell.paddingRight ?? 0);
  return Math.min(Number(cell.width ?? CELL), CELL) - padding;
}

describe('TabBarIcon', () => {
  it.each([true, false])('el ícono conserva su tamaño dentro de la celda de 24 dp (activa: %s)', async (focused) => {
    await renderIcon(focused);

    // Regresión: la píldora ponía padding de 16 dp al contenedor y el ícono quedaba con ancho ≤ 0.
    expect(widthLeftForIcon()).toBeGreaterThanOrEqual(CELL);
    expect(screen.getByTestId('tab-icon').props.size ?? CELL).toBe(CELL);
  });

  it('la activa lleva píldora detrás (absoluta) e ícono lleno; la inactiva, solo el contorno', async () => {
    await renderIcon(true);
    expect(StyleSheet.flatten(screen.getByTestId('tab-icon-pill').props.style).position).toBe('absolute');
    expect(screen.getByTestId('tab-icon').props.name).toBe('list');
  });

  it('inactiva: sin píldora e ícono de contorno', async () => {
    await renderIcon(false);
    expect(screen.queryByTestId('tab-icon-pill')).toBeNull();
    expect(screen.getByTestId('tab-icon').props.name).toBe('list-outline');
  });

  it.each(['light', 'dark'] as const)('contraste en %s: ícono activo sobre la píldora e inactivo sobre la barra ≥ 3:1', (mode) => {
    const colors = palettes[mode];
    expect(contrastRatio(colors.primary, colors.primaryTint, colors.card)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.textSecondary, colors.card)).toBeGreaterThanOrEqual(3);
  });
});
