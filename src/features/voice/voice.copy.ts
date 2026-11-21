// Microcopy del dictado por voz. Voz (§02): breve, tuteo, errores que orientan.

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    MIC_LABEL: 'Dictar por voz',
    MIC_STOP_LABEL: 'Dejar de dictar',
    MIC_HINT_START: 'Toca para hablar y llenar el campo con tu voz.',
    MIC_HINT_STOP: 'Toca para dejar de dictar.',
    LISTENING_TEXT: 'Escuchando…',
    MIC_STATE_LISTENING: 'escuchando',
    MIC_STATE_STOPPED: 'detenido',

    PRIVACY_NOTE: 'El reconocimiento de voz de Android puede procesar el audio en servicios de Google.',

    ERROR_DENIED: 'Sin permiso de micrófono. Puedes activarlo en Ajustes o dictar con el micrófono de tu teclado.',
    ERROR_UNAVAILABLE: 'Este teléfono no tiene dictado por voz disponible. Usa el micrófono de tu teclado.',
    ERROR_NO_SPEECH: 'No te escuché. Intenta de nuevo, un poco más cerca.',
    ERROR_GENERIC: 'No pudimos dictar ahora. Intenta de nuevo o usa el micrófono de tu teclado.',

    KEYBOARD_DICTATION_HELP:
      'También puedes dictar con el micrófono de tu teclado (Gboard): toca el campo y luego el ícono del micrófono.',
  },
  {
    MIC_LABEL: 'Dictate',
    MIC_STOP_LABEL: 'Stop dictating',
    MIC_HINT_START: 'Tap to speak and fill in the field with your voice.',
    MIC_HINT_STOP: 'Tap to stop dictating.',
    LISTENING_TEXT: 'Listening…',
    MIC_STATE_LISTENING: 'listening',
    MIC_STATE_STOPPED: 'stopped',

    PRIVACY_NOTE: "Android's speech recognition may process audio on Google services.",

    ERROR_DENIED: 'No microphone permission. You can turn it on in Settings or dictate with your keyboard microphone.',
    ERROR_UNAVAILABLE: "This phone doesn't have voice dictation available. Use your keyboard microphone.",
    ERROR_NO_SPEECH: "We didn't hear you. Try again, a bit closer.",
    ERROR_GENERIC: "We couldn't dictate right now. Try again or use your keyboard microphone.",

    KEYBOARD_DICTATION_HELP:
      'You can also dictate with your keyboard microphone (Gboard): tap the field, then the microphone icon.',
  },
);
