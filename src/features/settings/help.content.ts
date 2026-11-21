// Ayuda (11-6): preguntas frecuentes. Texto propio (no viene del Documento de Contenido).

import { localized } from '@/shared/i18n/localized';

export interface HelpEntry {
  question: string;
  answer: string;
}

const entriesEs: HelpEntry[] = [
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
    question: '¿De dónde sale el clima?',
    answer: 'De Open-Meteo.com. Solo enviamos la ciudad que elegiste en Ajustes.',
  },
  {
    question: '¿Cómo cambio o elimino una rutina?',
    answer: 'Toca la rutina en Inicio. Ahí puedes editarla, y al final está «Eliminar rutina».',
  },
];

const entriesEn: HelpEntry[] = [
  {
    question: 'Why does the app ask for my location?',
    answer:
      "To read your Wi-Fi name, the phone requires that permission. If you set your home in Settings, we also use it to alert you when you arrive. Your home's coordinates are stored only on your phone: they aren't sent anywhere or uploaded to your account.",
  },
  {
    question: 'How does “On arrival” work?',
    answer:
      'Create an “Arrival” routine, for example “Put the phone on charge” and “Put the keys away”. When you get home, you get a notification with those reminders. We detect your arrival through your home Wi-Fi or, if you set it up in Settings, through your location. If both detect it, we alert you only once. Arrival routines do not count toward your leaving streak.',
  },
  {
    question: 'Why does the arrival alert take a few minutes?',
    answer:
      "Android doesn't tell the app the instant you arrive: it can take a few minutes, especially with the app closed or battery saver on. For it to work better, allow location “all the time” and don't restrict the app's battery use. Without that permission, we only alert you through Wi-Fi.",
  },
  {
    question: 'Why was a Wi-Fi alert late?',
    answer:
      'With the app open, the alert arrives right away. With the app closed, the phone checks the network every 15 minutes or more. For it to work better, allow location “all the time”.',
  },
  {
    question: "What happens if I don't respond to an alert?",
    answer:
      'We remind you 2 times, spaced by the minutes you chose in “Snooze”. If you still don’t respond, it shows up in your history as “No response”.',
  },
  {
    question: 'Where does the weather come from?',
    answer: 'From Open-Meteo.com. We only send the city you chose in Settings.',
  },
  {
    question: 'How do I change or delete a routine?',
    answer: 'Tap the routine on Home. You can edit it there, and at the bottom there is “Delete routine”.',
  },
];

export default localized(
  { HELP_TITLE: 'Ayuda', HELP_ENTRIES: entriesEs },
  { HELP_TITLE: 'Help', HELP_ENTRIES: entriesEn },
);
