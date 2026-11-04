import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

import { normalizeDictation } from './voice.text';

export const SPEECH_LANG = 'es-CO';

export type SpeechErrorKind = 'denied' | 'unavailable' | 'no-speech' | 'error';

interface Options {
  /** Recibe el texto dictado (normalizado) cada vez que llega un resultado, parcial o final. */
  onText(dictated: string): void;
}

/**
 * Dictado por voz (SpeechRecognizer de Android vía expo-speech-recognition): es-CO, resultados
 * parciales en vivo, permiso denegado y servicio no disponible como errores con tipo. Al desmontar
 * cancela el reconocimiento.
 */
export function useSpeechToText({ onText }: Options) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechErrorKind | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
  });
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) onTextRef.current(normalizeDictation(transcript));
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error === 'aborted') return;
    if (event.error === 'not-allowed') setError('denied');
    else if (event.error === 'service-not-allowed' || event.error === 'language-not-supported') setError('unavailable');
    else if (event.error === 'no-speech' || event.error === 'speech-timeout') setError('no-speech');
    else setError('error');
  });

  useEffect(
    () => () => {
      // Siempre: el reconocimiento puede haber arrancado sin que llegara aún el evento «start» (el permiso o
      // el servicio tardan), y un abort sin nada en curso es inocuo.
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ya no había nada que cancelar.
      }
    },
    [],
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setError('unavailable');
        return;
      }
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError('denied');
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: SPEECH_LANG, interimResults: true, continuous: false });
    } catch {
      setError('error');
    }
  }, []);

  /** Termina y entrega lo que alcanzó a entender (resultado final). */
  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  /** Descarta el reconocimiento en curso. */
  const cancel = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    setListening(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { listening, error, start, stop, cancel, clearError };
}
