import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PressableScale } from './PressableScale';

jest.setTimeout(20000);

describe('PressableScale', () => {
  it('responde al toque sin esperar a la animación y conserva su rol', async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="Listo" onPress={onPress}>
        <Text>Listo</Text>
      </PressableScale>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado no responde', async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale accessibilityRole="button" accessibilityLabel="Listo" onPress={onPress} disabled>
        <Text>Listo</Text>
      </PressableScale>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
