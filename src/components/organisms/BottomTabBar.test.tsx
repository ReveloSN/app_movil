import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { BottomTabBar, type BottomTabItem } from './BottomTabBar';

jest.setTimeout(20000);

const ITEMS: BottomTabItem[] = [
  { key: 'index', label: 'Rutinas', icon: 'list-outline', activeIcon: 'list' },
  { key: 'history', label: 'Historial', icon: 'time-outline', activeIcon: 'time' },
  { key: 'settings', label: 'Ajustes', icon: 'settings-outline', activeIcon: 'settings' },
];

async function renderBar(selectedIndex: number, onSelect = jest.fn()) {
  const view = await render(
    <TestProviders>
      <BottomTabBar items={ITEMS} selectedIndex={selectedIndex} onSelect={onSelect} />
    </TestProviders>,
  );
  return { onSelect, view };
}

describe('BottomTabBar', () => {
  it.each([0, 1, 2])('con la pestaña %s activa, las 3 tienen ícono (lleno en la activa, contorno en las demás)', async (selected) => {
    await renderBar(selected);
    ITEMS.forEach((item, index) => {
      const icon = within(screen.getByTestId(`tab-${item.key}`)).getByTestId('tab-icon');
      expect(icon.props.name).toBe(index === selected ? item.activeIcon : item.icon);
    });
  });

  it('marca la pestaña correcta al cambiar de índice', async () => {
    const { view } = await renderBar(0);
    expect(screen.getByRole('tab', { name: 'Rutinas' }).props.accessibilityState).toEqual({ selected: true });

    await view.rerender(
      <TestProviders>
        <BottomTabBar items={ITEMS} selectedIndex={2} onSelect={jest.fn()} />
      </TestProviders>,
    );

    expect(screen.getByRole('tab', { name: 'Ajustes' }).props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByRole('tab', { name: 'Rutinas' }).props.accessibilityState).toEqual({ selected: false });
  });

  it('tocar una pestaña la elige', async () => {
    const { onSelect } = await renderBar(0);
    await fireEvent.press(screen.getByRole('tab', { name: 'Historial' }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
