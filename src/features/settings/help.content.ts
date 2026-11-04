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
      'Para leer el nombre de tu Wi-Fi, el teléfono exige ese permiso. Si defines tu casa en Ajustes, también la usamos para avisarte al llegar. Las coordenadas de tu casa se guardan solo en tu teléfono: no se envían a ningún lado ni se suben a tu cuenta.',
  },
  {
    question: '¿Cómo funciona «Al llegar»?',
    answer:
      'Crea una rutina de tipo «Llegada», por ejemplo «Poner a cargar el celular» y «Guardar las llaves». Cuando llegues a casa te llega una notificación con esos recordatorios. Detectamos tu llegada por el Wi-Fi de casa o, si lo configuras en Ajustes, por tu ubicación. Si ambos lo detectan, te avisamos una sola vez. Las rutinas de llegada no cuentan para tu racha de salidas.',
  },
  {
    question: '¿Por qué el aviso de llegada tarda unos minutos?',
    answer:
      'Android no avisa al instante que llegaste: puede tardar unos minutos, sobre todo con la app cerrada o con el ahorro de batería activado. Para que funcione mejor, permite la ubicación «todo el tiempo» y no restrinjas la batería de la app. Sin ese permiso, solo avisamos por Wi-Fi.',
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
