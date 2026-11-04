import { act, renderHook } from '@testing-library/react-native';

import { useSpeechToText } from './useSpeechToText';

type Handler = (event: unknown) => void;

// Módulo nativo simulado: los eventos se emiten a mano con `emit`.
jest.mock('expo-speech-recognition', () => {
  const handlers = new Map<string, Handler>();
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    __handlers: handlers,
    ExpoSpeechRecognitionModule: {
      isRecognitionAvailable: jest.fn(() => true),
      requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
    },
    useSpeechRecognitionEvent: (name: string, handler: Handler) => {
      useEffect(() => {
        handlers.set(name, handler);
        return () => {
          handlers.delete(name);
        };
      });
    },
  };
});

const mod = jest.requireMock('expo-speech-recognition') as {
  __handlers: Map<string, Handler>;
  ExpoSpeechRecognitionModule: Record<'isRecognitionAvailable' | 'requestPermissionsAsync' | 'start' | 'stop' | 'abort', jest.Mock>;
};
const native = mod.ExpoSpeechRecognitionModule;
const emit = (name: string, event: unknown = null) => act(() => mod.__handlers.get(name)?.(event));

beforeEach(() => {
  jest.clearAllMocks();
  native.isRecognitionAvailable.mockReturnValue(true);
  native.requestPermissionsAsync.mockResolvedValue({ granted: true });
});

describe('useSpeechToText', () => {
  it('pide permiso y arranca en es-CO con resultados parciales', async () => {
    const { result } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await act(() => result.current.start());
    expect(native.start).toHaveBeenCalledWith(expect.objectContaining({ lang: 'es-CO', interimResults: true }));
    await emit('start');
    expect(result.current.listening).toBe(true);
  });

  it('permiso denegado: no arranca y marca el error', async () => {
    native.requestPermissionsAsync.mockResolvedValue({ granted: false });
    const { result } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await act(() => result.current.start());
    expect(native.start).not.toHaveBeenCalled();
    expect(result.current.error).toBe('denied');
  });

  it('reconocimiento no disponible: no pide permiso ni arranca', async () => {
    native.isRecognitionAvailable.mockReturnValue(false);
    const { result } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await act(() => result.current.start());
    expect(native.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.error).toBe('unavailable');
  });

  it('entrega el resultado parcial y el final normalizados', async () => {
    const onText = jest.fn();
    const { result } = await renderHook(() => useSpeechToText({ onText }));
    await act(() => result.current.start());
    await emit('start');
    await emit('result', { isFinal: false, results: [{ transcript: ' salgo a ' }] });
    await emit('result', { isFinal: true, results: [{ transcript: 'salgo  a la  u' }] });
    expect(onText).toHaveBeenNthCalledWith(1, 'salgo a');
    expect(onText).toHaveBeenNthCalledWith(2, 'salgo a la u');
    await emit('end');
    expect(result.current.listening).toBe(false);
  });

  it('traduce los errores del módulo y no trata "aborted" como error', async () => {
    const { result } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await emit('error', { error: 'not-allowed', message: '' });
    expect(result.current.error).toBe('denied');
    await emit('error', { error: 'no-speech', message: '' });
    expect(result.current.error).toBe('no-speech');
    await emit('error', { error: 'network', message: '' });
    expect(result.current.error).toBe('error');
    await act(() => result.current.clearError());
    await emit('error', { error: 'aborted', message: '' });
    expect(result.current.error).toBeNull();
  });

  it('detener y cancelar llaman al módulo', async () => {
    const { result } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await act(() => result.current.stop());
    expect(native.stop).toHaveBeenCalled();
    await act(() => result.current.cancel());
    expect(native.abort).toHaveBeenCalled();
  });

  it('al desmontar con el reconocimiento activo, lo cancela', async () => {
    const { result, unmount } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await emit('start');
    expect(result.current.listening).toBe(true);
    await unmount();
    expect(native.abort).toHaveBeenCalledTimes(1);
  });

  it('al desmontar justo tras arrancar (antes del evento «start»), también lo cancela', async () => {
    const { result, unmount } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await act(() => result.current.start());
    expect(native.start).toHaveBeenCalled();
    expect(result.current.listening).toBe(false);
    await unmount();
    expect(native.abort).toHaveBeenCalledTimes(1);
  });

  it('al desmontar tras terminar el reconocimiento, abortar sigue siendo inocuo (y no lanza)', async () => {
    native.abort.mockImplementationOnce(() => {
      throw new Error('nada en curso');
    });
    const { unmount } = await renderHook(() => useSpeechToText({ onText: jest.fn() }));
    await emit('start');
    await emit('end');
    await expect(unmount()).resolves.not.toThrow();
    expect(native.abort).toHaveBeenCalledTimes(1);
  });
});
