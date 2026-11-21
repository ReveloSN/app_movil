// Microcopy de Plantillas (P10).

import { localized } from '@/shared/i18n/localized';

/** Textos de una plantilla; los ítems van en el mismo orden que en `routine-templates.data.ts`. */
export interface TemplateTexts {
  name: string;
  description: string;
  items: string[];
  suggestedTrigger: string;
}

// Contenido de P10. Nombres ≤ 24 caracteres e ítems ≤ 32 (límites de routine.validation).
const templatesEs: Record<string, TemplateTexts> = {
  'leaving-home': {
    name: 'Saliendo de casa',
    description: 'Lo esencial antes de cerrar la puerta.',
    items: ['Llaves', 'Billetera', 'Celular cargado', 'Cargador', 'Comida de la mascota servida', 'Estufa apagada'],
    suggestedTrigger: 'Salir del Wi-Fi de Casa',
  },
  // El brief dice "Cerrando jornada de estudio" (27 caracteres): supera el máximo de 24 del nombre.
  'end-of-study': {
    name: 'Cerrando el estudio',
    description: 'Deja todo guardado y listo para mañana.',
    items: ['Guardar archivos en la nube', 'Anotar pendiente de mañana', 'Cargar portátil', 'Ordenar escritorio'],
    suggestedTrigger: '6:00 p. m., L a V',
  },
  'leaving-work': {
    name: 'Saliendo del trabajo',
    description: 'Que nada se quede en la oficina.',
    items: ['Portátil y cargador', 'Carné de acceso', 'Tarro del almuerzo', 'Apagar pantalla'],
    suggestedTrigger: 'Salir del Wi-Fi de Trabajo',
  },
  'before-bed': {
    name: 'Antes de dormir',
    description: 'Casa segura y todo listo para descansar.',
    items: ['Puerta con seguro', 'Gas cerrado', 'Alarma puesta', 'Celular cargando'],
    suggestedTrigger: '10:30 p. m., diario',
  },
  'before-travel': {
    name: 'Antes de viajar',
    description: 'Lo indispensable antes de salir de viaje.',
    items: ['Documento de identidad', 'Tiquete', 'Cargadores', 'Medicamentos', 'Nevera desconectada'],
    suggestedTrigger: 'Manual',
  },
  'to-class': {
    name: 'Saliendo a clase',
    description: 'Lo de la universidad, listo antes de salir.',
    items: ['Carné estudiantil', 'Portátil cargado', 'Cargador', 'Cuaderno', 'Botella de agua'],
    suggestedTrigger: '6:30 a. m., L a V',
  },
  'family-outing': {
    name: 'Salida en familia',
    description: 'Que nadie se quede sin lo suyo al salir juntos.',
    items: ['Llaves del carro', 'Documentos', 'Agua y meriendas', 'Medicamentos', 'Luces apagadas'],
    suggestedTrigger: 'Manual',
  },
  gym: {
    name: 'Al gimnasio',
    description: 'Lo necesario para entrenar sin volver a casa.',
    items: ['Ropa deportiva', 'Tenis', 'Toalla', 'Botella de agua', 'Candado del casillero', 'Audífonos'],
    suggestedTrigger: 'Manual',
  },
  'arriving-home': {
    name: 'Llegar a casa',
    description: 'Recordatorios al volver, sin tener que acordarte.',
    items: [
      'Poner a cargar el celular',
      'Guardar las llaves',
      'Dejar la billetera en su lugar',
      'Sacar el almuerzo de la mochila',
      'Lavarme las manos',
    ],
    suggestedTrigger: 'Llegar al Wi-Fi de Casa',
  },
};

const templatesEn: Record<string, TemplateTexts> = {
  'leaving-home': {
    name: 'Leaving home',
    description: 'The essentials before you close the door.',
    items: ['Keys', 'Wallet', 'Charged phone', 'Charger', 'Pet food served', 'Stove off'],
    suggestedTrigger: 'Leaving the Home Wi-Fi',
  },
  'end-of-study': {
    name: 'Wrapping up study',
    description: 'Save everything and get ready for tomorrow.',
    items: ['Save files to the cloud', "Note tomorrow's to-dos", 'Charge laptop', 'Tidy desk'],
    suggestedTrigger: '6:00 PM, Mon to Fri',
  },
  'leaving-work': {
    name: 'Leaving work',
    description: 'Leave nothing behind at the office.',
    items: ['Laptop and charger', 'Access badge', 'Lunch container', 'Turn off screen'],
    suggestedTrigger: 'Leaving the Work Wi-Fi',
  },
  'before-bed': {
    name: 'Before bed',
    description: 'A safe home and everything ready to rest.',
    items: ['Door locked', 'Gas off', 'Alarm set', 'Phone charging'],
    suggestedTrigger: '10:30 PM, daily',
  },
  'before-travel': {
    name: 'Before a trip',
    description: 'The essentials before you head out on a trip.',
    items: ['ID document', 'Ticket', 'Chargers', 'Medication', 'Fridge unplugged'],
    suggestedTrigger: 'Manual',
  },
  'to-class': {
    name: 'Heading to class',
    description: 'Your school things, ready before you leave.',
    items: ['Student ID', 'Charged laptop', 'Charger', 'Notebook', 'Water bottle'],
    suggestedTrigger: '6:30 AM, Mon to Fri',
  },
  'family-outing': {
    name: 'Family outing',
    description: 'So no one is left without their things when you head out together.',
    items: ['Car keys', 'Documents', 'Water and snacks', 'Medication', 'Lights off'],
    suggestedTrigger: 'Manual',
  },
  gym: {
    name: 'Off to the gym',
    description: 'What you need to work out without going back home.',
    items: ['Gym clothes', 'Sneakers', 'Towel', 'Water bottle', 'Locker padlock', 'Headphones'],
    suggestedTrigger: 'Manual',
  },
  'arriving-home': {
    name: 'Arriving home',
    description: 'Reminders for when you get back, no need to remember.',
    items: ['Put phone on charge', 'Put the keys away', 'Leave the wallet in its place', 'Take lunch out of the backpack', 'Wash my hands'],
    suggestedTrigger: 'Reaching the Home Wi-Fi',
  },
};

export default localized(
  {
    USE_TEMPLATE_LABEL: 'Usar plantilla',

    // Sin código en el Documento de Contenido.
    BROWSE_TEMPLATES_LABEL: 'Ver plantillas',

    itemCountLabel: (count: number) => (count === 1 ? '1 ítem' : `${count} ítems`),

    suggestedTriggerLabel: (trigger: string) => `Aviso sugerido: ${trigger}`,

    /** Nombres de red que precargan los avisos de Wi-Fi de las plantillas. */
    HOME_NETWORK_NAME: 'Casa',
    WORK_NETWORK_NAME: 'Trabajo',

    templates: templatesEs,
  },
  {
    USE_TEMPLATE_LABEL: 'Use template',

    BROWSE_TEMPLATES_LABEL: 'See templates',

    itemCountLabel: (count: number) => (count === 1 ? '1 item' : `${count} items`),

    suggestedTriggerLabel: (trigger: string) => `Suggested alert: ${trigger}`,

    HOME_NETWORK_NAME: 'Home',
    WORK_NETWORK_NAME: 'Work',

    templates: templatesEn,
  },
);
