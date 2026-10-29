import { fireEvent, render, screen } from '@testing-library/react-native';

import { progressCount, progressSpoken } from '@/features/checklist/checklist.copy';
import { TestProviders } from '@/shared/testing/TestProviders';

import { VerifyHeader } from './VerifyHeader';

jest.setTimeout(20000);

async function renderHeader(checked: number, total: number, onClose = jest.fn()) {
  await render(
    <TestProviders>
      <VerifyHeader
        name="Salir de casa"
        icon="home-outline"
        accentColor="#096B4C"
        accentTint="#DDF0E6"
        checked={checked}
        total={total}
        closeLabel="Cerrar verificación"
        countLabel={progressCount(checked, total)}
        progressLabel={progressSpoken(checked, total)}
        onClose={onClose}
      />
    </TestProviders>,
  );
  return onClose;
}

describe('VerifyHeader', () => {
  it('muestra el avance como texto junto a la barra', async () => {
    await renderHeader(3, 8);
    expect(screen.getByText('3 de 8', { includeHiddenElements: true })).toBeTruthy();
  });

  it('el lector de pantalla oye el avance una sola vez, por la barra', async () => {
    await renderHeader(3, 8);
    expect(screen.getByLabelText('3 de 8 ítems listos')).toBeTruthy();
    expect(screen.queryByText('3 de 8')).toBeNull();
  });

  it('cerrar responde al toque', async () => {
    const onClose = await renderHeader(0, 5);
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar verificación' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
