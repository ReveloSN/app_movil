import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { Share } from 'react-native';

import { TestProviders } from '@/shared/testing/TestProviders';

import { decodeRoutineShare, encodeRoutineShare, type SharedRoutine } from './routine-share.codec';
import { ShareRoutineButton } from './ShareRoutineButton';
import { useImportRoutine } from './useImportRoutine';

const mockCreate = jest.fn();
const mockToast = { show: jest.fn(), hide: jest.fn() };
const mockCloseTo = jest.fn();
jest.mock('@/features/routines/useRoutines', () => ({ useRoutines: () => ({ createRoutine: mockCreate }) }));
jest.mock('@/features/feedback/toast.context', () => ({ useToast: () => mockToast }));
jest.mock('@/features/forms/useCloseAfterSave', () => ({ closeTo: (destination: string) => mockCloseTo(destination) }));

jest.setTimeout(20000);

const ROUTINE: SharedRoutine = {
  name: 'Al gimnasio',
  icon: 'barbell-outline',
  color: 'purple',
  items: [
    { label: 'Toalla', kind: 'carry', critical: false },
    { label: 'Candado del casillero', kind: 'carry', critical: true },
  ],
};

beforeEach(() => {
  mockCreate.mockReset();
  mockToast.show.mockReset();
  mockCloseTo.mockReset();
});

describe('importar rutina', () => {
  it('código válido: vista previa y luego una COPIA nueva sin avisos; cierra y avisa', async () => {
    mockCreate.mockResolvedValue({ status: 'saved', routine: { id: 'nuevo' } });
    const { result } = await renderHook(() => useImportRoutine());

    await act(async () => result.current.setCode(`Mira mi rutina:\n${encodeRoutineShare(ROUTINE)}`));
    await act(async () => result.current.review());
    expect(result.current.preview).toEqual(ROUTINE);

    await act(async () => result.current.add());
    expect(mockCreate).toHaveBeenCalledWith({ name: 'Al gimnasio', icon: 'barbell-outline', color: 'purple', items: ROUTINE.items });
    expect(mockCreate.mock.calls[0][0]).not.toHaveProperty('triggers');
    expect(mockToast.show).toHaveBeenCalledWith('Rutina añadida.');
    expect(mockCloseTo).toHaveBeenCalledWith('home');
  });

  it('código dañado: error que orienta y nada se crea', async () => {
    const { result } = await renderHook(() => useImportRoutine());
    await act(async () => result.current.setCode(encodeRoutineShare(ROUTINE).slice(0, -3) + 'abc'));
    await act(async () => result.current.review());
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('El código está incompleto o mal copiado. Cópialo completo y vuelve a intentar.');
    await act(async () => result.current.add());
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('si guardar falla, no se cierra y lo dice', async () => {
    mockCreate.mockResolvedValue({ status: 'failed', error: 'No se pudo guardar la rutina.' });
    const { result } = await renderHook(() => useImportRoutine());
    await act(async () => result.current.setCode(encodeRoutineShare(ROUTINE)));
    await act(async () => result.current.review());
    await act(async () => result.current.add());
    expect(mockCloseTo).not.toHaveBeenCalled();
    expect(result.current.error).toBe('No se pudo guardar la rutina.');
  });
});

describe('compartir rutina', () => {
  it('abre la hoja del sistema con un texto amable y el código de la copia', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await render(
      <TestProviders>
        <ShareRoutineButton routine={ROUTINE} />
      </TestProviders>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Compartir rutina' }));

    const message = share.mock.calls[0][0] && 'message' in share.mock.calls[0][0] ? share.mock.calls[0][0].message : '';
    expect(message).toContain('Te comparto mi rutina «Al gimnasio»');
    expect(decodeRoutineShare(message ?? '')).toEqual(ROUTINE);
  });
});
