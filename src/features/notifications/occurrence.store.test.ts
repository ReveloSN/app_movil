import AsyncStorage from '@react-native-async-storage/async-storage';

import { updateOccurrences } from './occurrence.store';

describe('updateOccurrences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('no escribe en el almacenamiento cuando no hay cambios', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const removeItem = jest.spyOn(AsyncStorage, 'removeItem');

    const result = await updateOccurrences(async (entries) => ({ entries, result: 'ok' }));

    expect(result).toBe('ok');
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});
