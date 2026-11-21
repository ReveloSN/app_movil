// Microcopy de P04 (crear / editar rutina).

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    NEW_ROUTINE_TITLE: 'Nueva rutina',
    EDIT_ROUTINE_TITLE: 'Editar rutina',
    CANCEL_LABEL: 'Cancelar',

    /** BTN: "Crear rutina" al crear y "Guardar cambios" al editar (también en la hoja P05). */
    CREATE_ROUTINE_LABEL: 'Crear rutina',
    SAVE_CHANGES_LABEL: 'Guardar cambios',

    ROUTINE_NAME_LABEL: 'Nombre de la rutina',

    // Errores en línea al guardar. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
    NAME_REQUIRED: 'Ponle un nombre a tu rutina.',
    ITEMS_REQUIRED: 'Añade al menos un ítem.',
    ITEM_REQUIRED: 'Escribe el ítem.',
    maxCharacters: (max: number) => `Máximo ${max} caracteres.`,
    /** ER-05 */
    MAX_ITEMS_MESSAGE: 'Máximo 12 ítems. Las listas cortas se revisan más rápido.',
    maxTriggers: (max: number) => `Máximo ${max} avisos por rutina.`,

    // Avisos breves tras guardar o eliminar. CF-03 (con aviso) está en trigger.copy (routineSavedMessage).
    CHANGES_SAVED: 'Cambios guardados.',
    ROUTINE_DELETED: 'Rutina eliminada.',

    // Errores de guardado y carga de rutinas (los ve la persona).
    LOAD_ROUTINES_ERROR: 'No pudimos cargar tus rutinas. Revisa tu conexión e inténtalo de nuevo.',
    SAVE_ROUTINE_ERROR: 'No se pudo guardar la rutina. Revisa tu conexión e inténtalo de nuevo.',
    DELETE_ROUTINE_ERROR: 'No se pudo eliminar la rutina. Revisa tu conexión e inténtalo de nuevo.',

    ADD_ITEM_LABEL: 'Añadir ítem',
    ITEMS_SECTION_TITLE: 'Ítems',
    /** Etiqueta para lector de pantalla del contador de la sección: "Ítems, 3 de 12". */
    itemsSectionLabel: (count: number, max: number) => `Ítems, ${count} de ${max}`,

    /** EV-03 */
    EMPTY_ITEMS_MESSAGE: 'Añade lo que no puede faltar. Con 3 o 4 cosas basta.',

    // P05 (hoja "Editar ítem"). Sin código en el Documento de Contenido: propuestos, pendientes de validar.
    NEW_ITEM_TITLE: 'Nuevo ítem',
    EDIT_ITEM_TITLE: 'Editar ítem',
    CLOSE_ITEM_LABEL: 'Cerrar',
    ITEM_LABEL_FIELD: '¿Qué es?',
    ITEM_LABEL_PLACEHOLDER: 'Ej. Llaves',
    ITEM_ICON_GROUP_LABEL: 'Ícono del ítem',
    ITEM_KIND_LABEL: 'Tipo',
    /** Nombre de cada tipo de ítem (clave = ItemKind). */
    ITEM_KIND_NAMES: { carry: 'Llevar', do: 'Hacer', check: 'Comprobar' },
    CRITICAL_SWITCH_LABEL: 'Marcar como crítico',
    CRITICAL_LABEL: 'Crítico',
    ITEM_NOTE_FIELD: 'Nota',
    ITEM_NOTE_PLACEHOLDER: 'Opcional. Ej. En el cajón de la entrada',
    editItemHint: (label: string) => `Edita «${label}»`,
    /** Reordenar ítems: asa para arrastrar y botones Subir/Bajar (alternativa al arrastre). */
    MOVE_UP_LABEL: 'Subir',
    MOVE_DOWN_LABEL: 'Bajar',
    moveUpItemLabel: (label: string) => `Subir «${label}»`,
    moveDownItemLabel: (label: string) => `Bajar «${label}»`,
    reorderHandleLabel: (label: string) => `Reordenar «${label}»`,
    REORDER_HANDLE_HINT: 'Toca para ver Subir y Bajar. Mantén pulsado y arrastra para moverlo.',
    itemMovedMessage: (label: string, position: number, total: number) =>
      `«${label}» ahora está en la posición ${position} de ${total}.`,
    removeItemLabel: (label: string) => `Quitar «${label}»`,
    /** Aviso breve al quitar un ítem (con "Deshacer"). */
    itemRemovedMessage: (label: string) => `Quitaste «${label}».`,

    // 04-2. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
    ICON_LABEL: 'Ícono',
    COLOR_LABEL: 'Color',
    /** Texto alternativo de cada ícono de rutina (clave = nombre del ícono). */
    ROUTINE_ICON_LABELS: {
      'checkbox-outline': 'Lista',
      'home-outline': 'Casa',
      'briefcase-outline': 'Trabajo',
      'school-outline': 'Estudio',
      'moon-outline': 'Noche',
      'airplane-outline': 'Viaje',
      'barbell-outline': 'Ejercicio',
      'cart-outline': 'Compras',
      'paw-outline': 'Mascota',
      'car-outline': 'Carro',
    } as Record<string, string>,
    /** Nombre de cada color de rutina (clave = RoutineColorKey). */
    ROUTINE_COLOR_LABELS: {
      green: 'Verde',
      blue: 'Azul',
      amber: 'Ámbar',
      purple: 'Morado',
      gray: 'Gris',
    } as Record<string, string>,
    /** 05-2: texto alternativo de cada ícono de ítem (clave = nombre del ícono). */
    ITEM_ICON_LABELS: {
      'cube-outline': 'Objeto',
      'key-outline': 'Llaves',
      'wallet-outline': 'Billetera',
      'phone-portrait-outline': 'Celular',
      'battery-charging-outline': 'Cargador',
      'laptop-outline': 'Portátil',
      'card-outline': 'Tarjeta o carné',
      'document-text-outline': 'Documento',
      'medkit-outline': 'Medicamentos',
      'glasses-outline': 'Gafas',
      'headset-outline': 'Audífonos',
      'umbrella-outline': 'Paraguas',
      'water-outline': 'Agua',
      'restaurant-outline': 'Comida',
      'paw-outline': 'Mascota',
      'flame-outline': 'Estufa o gas',
      'bulb-outline': 'Luces',
      'lock-closed-outline': 'Puerta o seguro',
      'alarm-outline': 'Alarma',
      'cloud-upload-outline': 'Guardar en la nube',
    } as Record<string, string>,

    // 04-4. Sin código en el Documento de Contenido: propuestos, pendientes de validar.
    SUGGESTIONS_TITLE: 'Sugerencias',
    addSuggestionLabel: (label: string) => `Añadir ${label}`,
    /** 04-4: lo que más se olvida al salir (mismo vocabulario que las plantillas). Etiquetas ≤ 32. */
    ITEM_SUGGESTION_LABELS: {
      keys: 'Llaves',
      wallet: 'Billetera',
      phone: 'Celular cargado',
      charger: 'Cargador',
      stove: 'Estufa apagada',
      door: 'Puerta con seguro',
      lights: 'Luces apagadas',
      windows: 'Ventanas cerradas',
      headphones: 'Audífonos',
      glasses: 'Gafas',
      umbrella: 'Paraguas',
      water: 'Botella de agua',
    } as Record<string, string>,

    /** 04-7 */
    DELETE_ROUTINE_LABEL: 'Eliminar rutina',

    /** DC-01 */
    deleteRoutineMessage: (name: string) => `¿Eliminar «${name}»? También se borra su historial.`,
    DELETE_CONFIRM: 'Eliminar',
    DELETE_CANCEL: 'Cancelar',

    // Sin código en el Documento de Contenido.
    LOAD_ROUTINE_ERROR: 'No pudimos cargar esta rutina. Revisa tu conexión e inténtalo de nuevo.',
    ROUTINE_NOT_FOUND: 'Esta rutina ya no existe.',
    LOADING_ROUTINE_LABEL: 'Cargando rutina',

    // Tipo de rutina (salida o llegada). Solo se elige al crear.
    ROUTINE_KIND_LABEL: 'Tipo de rutina',
    DEPARTURE_KIND_LABEL: 'Salida',
    ARRIVAL_KIND_LABEL: 'Llegada',
    ROUTINE_KIND_HINT: {
      departure: 'Para no olvidar nada antes de salir.',
      arrival: 'Recordatorios al volver a casa, como poner el celular a cargar. Define tu casa en Ajustes para detectarla sin Wi-Fi.',
    },
    NAME_PLACEHOLDER: {
      departure: 'Ej. Salir al trabajo',
      arrival: 'Ej. Llegar a casa',
    },

    // Pantallas de rutina (src/app/routine): encabezados y etiquetas que no tienen otro módulo de textos.
    BACK_TITLE: 'Volver',
    TEMPLATES_TITLE: 'Plantillas',
    TRIGGER_SECTION_KIND: 'Tipo',
    TRIGGER_KIND_GROUP_LABEL: 'Tipo de aviso',
    TRIGGER_SECTION_NETWORK: 'Red',
    SSID_LABEL: 'Nombre de la red Wi-Fi',
    SSID_PLACEHOLDER: 'Como aparece en tu teléfono',
    NETWORK_NAME_LABEL: '¿Cómo la llamas?',
    NETWORK_NAME_PLACEHOLDER: 'Ej. Casa',
    WINDOW_FROM_LABEL: 'Desde',
    WINDOW_TO_LABEL: 'Hasta',
    TRIGGER_SECTION_SCHEDULE: 'Hora y días',
    TIME_LABEL: 'Hora',
  },
  {
    NEW_ROUTINE_TITLE: 'New routine',
    EDIT_ROUTINE_TITLE: 'Edit routine',
    CANCEL_LABEL: 'Cancel',

    CREATE_ROUTINE_LABEL: 'Create routine',
    SAVE_CHANGES_LABEL: 'Save changes',

    ROUTINE_NAME_LABEL: 'Routine name',

    NAME_REQUIRED: 'Give your routine a name.',
    ITEMS_REQUIRED: 'Add at least one item.',
    ITEM_REQUIRED: 'Type the item.',
    maxCharacters: (max: number) => `${max} characters max.`,
    MAX_ITEMS_MESSAGE: '12 items max. Short lists are faster to check.',
    maxTriggers: (max: number) => `${max} alerts max per routine.`,

    CHANGES_SAVED: 'Changes saved.',
    ROUTINE_DELETED: 'Routine deleted.',

    LOAD_ROUTINES_ERROR: "We couldn't load your routines. Check your connection and try again.",
    SAVE_ROUTINE_ERROR: "Couldn't save the routine. Check your connection and try again.",
    DELETE_ROUTINE_ERROR: "Couldn't delete the routine. Check your connection and try again.",

    ADD_ITEM_LABEL: 'Add item',
    ITEMS_SECTION_TITLE: 'Items',
    itemsSectionLabel: (count: number, max: number) => `Items, ${count} of ${max}`,

    EMPTY_ITEMS_MESSAGE: "Add what can't be forgotten. 3 or 4 things are enough.",

    NEW_ITEM_TITLE: 'New item',
    EDIT_ITEM_TITLE: 'Edit item',
    CLOSE_ITEM_LABEL: 'Close',
    ITEM_LABEL_FIELD: 'What is it?',
    ITEM_LABEL_PLACEHOLDER: 'E.g. Keys',
    ITEM_ICON_GROUP_LABEL: 'Item icon',
    ITEM_KIND_LABEL: 'Type',
    ITEM_KIND_NAMES: { carry: 'Take', do: 'Do', check: 'Check' },
    CRITICAL_SWITCH_LABEL: 'Mark as critical',
    CRITICAL_LABEL: 'Critical',
    ITEM_NOTE_FIELD: 'Note',
    ITEM_NOTE_PLACEHOLDER: 'Optional. E.g. In the entryway drawer',
    editItemHint: (label: string) => `Edit "${label}"`,
    MOVE_UP_LABEL: 'Move up',
    MOVE_DOWN_LABEL: 'Move down',
    moveUpItemLabel: (label: string) => `Move up "${label}"`,
    moveDownItemLabel: (label: string) => `Move down "${label}"`,
    reorderHandleLabel: (label: string) => `Reorder "${label}"`,
    REORDER_HANDLE_HINT: 'Tap to see Move up and Move down. Press and hold, then drag to move it.',
    itemMovedMessage: (label: string, position: number, total: number) => `"${label}" is now in position ${position} of ${total}.`,
    removeItemLabel: (label: string) => `Remove "${label}"`,
    itemRemovedMessage: (label: string) => `You removed "${label}".`,

    ICON_LABEL: 'Icon',
    COLOR_LABEL: 'Color',
    ROUTINE_ICON_LABELS: {
      'checkbox-outline': 'List',
      'home-outline': 'Home',
      'briefcase-outline': 'Work',
      'school-outline': 'Study',
      'moon-outline': 'Night',
      'airplane-outline': 'Travel',
      'barbell-outline': 'Exercise',
      'cart-outline': 'Shopping',
      'paw-outline': 'Pet',
      'car-outline': 'Car',
    },
    ROUTINE_COLOR_LABELS: {
      green: 'Green',
      blue: 'Blue',
      amber: 'Amber',
      purple: 'Purple',
      gray: 'Gray',
    },
    ITEM_ICON_LABELS: {
      'cube-outline': 'Object',
      'key-outline': 'Keys',
      'wallet-outline': 'Wallet',
      'phone-portrait-outline': 'Phone',
      'battery-charging-outline': 'Charger',
      'laptop-outline': 'Laptop',
      'card-outline': 'Card or badge',
      'document-text-outline': 'Document',
      'medkit-outline': 'Medication',
      'glasses-outline': 'Glasses',
      'headset-outline': 'Headphones',
      'umbrella-outline': 'Umbrella',
      'water-outline': 'Water',
      'restaurant-outline': 'Food',
      'paw-outline': 'Pet',
      'flame-outline': 'Stove or gas',
      'bulb-outline': 'Lights',
      'lock-closed-outline': 'Door or lock',
      'alarm-outline': 'Alarm',
      'cloud-upload-outline': 'Save to the cloud',
    },

    SUGGESTIONS_TITLE: 'Suggestions',
    addSuggestionLabel: (label: string) => `Add ${label}`,
    ITEM_SUGGESTION_LABELS: {
      keys: 'Keys',
      wallet: 'Wallet',
      phone: 'Charged phone',
      charger: 'Charger',
      stove: 'Stove off',
      door: 'Door locked',
      lights: 'Lights off',
      windows: 'Windows closed',
      headphones: 'Headphones',
      glasses: 'Glasses',
      umbrella: 'Umbrella',
      water: 'Water bottle',
    },

    DELETE_ROUTINE_LABEL: 'Delete routine',

    deleteRoutineMessage: (name: string) => `Delete "${name}"? Its history will be deleted too.`,
    DELETE_CONFIRM: 'Delete',
    DELETE_CANCEL: 'Cancel',

    LOAD_ROUTINE_ERROR: "We couldn't load this routine. Check your connection and try again.",
    ROUTINE_NOT_FOUND: "This routine doesn't exist anymore.",
    LOADING_ROUTINE_LABEL: 'Loading routine',

    ROUTINE_KIND_LABEL: 'Routine type',
    DEPARTURE_KIND_LABEL: 'Leaving',
    ARRIVAL_KIND_LABEL: 'Arriving',
    ROUTINE_KIND_HINT: {
      departure: "So you don't forget anything before you leave.",
      arrival: 'Reminders for when you get home, like putting your phone on charge. Set your home in Settings to detect it without Wi-Fi.',
    },
    NAME_PLACEHOLDER: {
      departure: 'E.g. Leave for work',
      arrival: 'E.g. Arrive home',
    },

    BACK_TITLE: 'Back',
    TEMPLATES_TITLE: 'Templates',
    TRIGGER_SECTION_KIND: 'Type',
    TRIGGER_KIND_GROUP_LABEL: 'Alert type',
    TRIGGER_SECTION_NETWORK: 'Network',
    SSID_LABEL: 'Wi-Fi network name',
    SSID_PLACEHOLDER: 'As it appears on your phone',
    NETWORK_NAME_LABEL: 'What do you call it?',
    NETWORK_NAME_PLACEHOLDER: 'E.g. Home',
    WINDOW_FROM_LABEL: 'From',
    WINDOW_TO_LABEL: 'Until',
    TRIGGER_SECTION_SCHEDULE: 'Time and days',
    TIME_LABEL: 'Time',
  },
);
