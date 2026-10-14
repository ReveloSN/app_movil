// Ayuda (11-6): preguntas frecuentes. Texto propio (no viene del Documento de Contenido).

export interface HelpEntry {
  question: string;
  answer: string;
}

export const HELP_TITLE = 'Ayuda';

export const HELP_ENTRIES: readonly HelpEntry[] = [
  {
    question: '¿Por qué la app pide mi ubicación?',
    answer:
      'Para leer el nombre de tu Wi-Fi, el teléfono exige ese permiso. No guardamos tu ubicación: solo comparamos el nombre de la red con tus redes de casa.',
  },
  {
    question: '¿Por qué un aviso de Wi-Fi llegó tarde?',
    answer:
      'Con la app abierta, el aviso llega al momento. Con la app cerrada, el teléfono revisa la red cada 15 minutos o más. Para que funcione mejor, permite la ubicación «todo el tiempo».',
  },
  {
    question: '¿Qué pasa si no respondo un aviso?',
    answer:
      'Te lo recordamos 2 veces, separadas por los minutos que elegiste en «Posponer». Si sigues sin responder, queda en tu historial como «Sin respuesta».',
  },
  {
    question: '¿Cómo cambio o elimino una rutina?',
    answer: 'Toca la rutina en Inicio. Ahí puedes editarla, y al final está «Eliminar rutina».',
  },
];
