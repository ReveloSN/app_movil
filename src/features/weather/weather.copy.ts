// Textos del clima. Sin código en el Documento de Contenido: propuestos, pendientes de validar.

import { localized } from '@/shared/i18n/localized';

type CityName = { name: string; region: string | null; country: string | null };

/** "Bogotá, Cundinamarca, Colombia": los nombres ya vienen en el idioma de la búsqueda. */
const cityLabel = (city: CityName) => [city.name, city.region, city.country].filter(Boolean).join(', ');

export default localized(
  {
    WEATHER_SECTION_TITLE: 'Clima',
    CITY_FIELD: 'Ciudad para el clima',
    CITY_PLACEHOLDER: 'Ej. Bogotá',
    SEARCH_LABEL: 'Buscar',
    CHANGE_CITY_LABEL: 'Cambiar ciudad',
    WEATHER_SWITCH: 'Sugerencias de clima',
    WEATHER_HINT_NO_CITY: 'Elige una ciudad para activarlas.',
    WEATHER_HINT: 'Si va a llover, te sugerimos el paraguas al verificar.',
    cityLabel,
    useCityLabel: (label: string) => `Usar ${label}`,
    NO_CITIES: 'No encontramos esa ciudad. Prueba con otro nombre.',
    SEARCH_ERROR: 'No pudimos buscar la ciudad. Revisa tu conexión e inténtalo de nuevo.',
    SAVE_ERROR: 'No se pudo guardar el cambio. Inténtalo de nuevo.',

    // Aviso breve de privacidad (primera vez).
    CONSENT_TITLE: 'Clima',
    CONSENT_TEXT: 'Solo enviamos la ciudad que elegiste para consultar el clima.',
    CONSENT_ACCEPT: 'Entendido',
    CONSENT_DECLINE: 'Ahora no',

    // P07.
    ADD_TODAY: 'Añadir solo hoy',
    NO_THANKS: 'No',
    WEATHER_ITEM_ORIGIN: 'clima',

    /** Regla de la lluvia (P07): el ítem que se sugiere y la pregunta. */
    UMBRELLA_LABEL: 'Paraguas',
    UMBRELLA_MESSAGE: 'Hoy puede llover. ¿Añadimos «Paraguas»?',
  },
  {
    WEATHER_SECTION_TITLE: 'Weather',
    CITY_FIELD: 'City for the weather',
    CITY_PLACEHOLDER: 'E.g. Bogotá',
    SEARCH_LABEL: 'Search',
    CHANGE_CITY_LABEL: 'Change city',
    WEATHER_SWITCH: 'Weather suggestions',
    WEATHER_HINT_NO_CITY: 'Pick a city to turn them on.',
    WEATHER_HINT: "If it's going to rain, we'll suggest an umbrella when you check.",
    cityLabel,
    useCityLabel: (label: string) => `Use ${label}`,
    NO_CITIES: "We couldn't find that city. Try another name.",
    SEARCH_ERROR: "We couldn't search for the city. Check your connection and try again.",
    SAVE_ERROR: "The change couldn't be saved. Try again.",

    CONSENT_TITLE: 'Weather',
    CONSENT_TEXT: 'We only send the city you picked to look up the weather.',
    CONSENT_ACCEPT: 'Got it',
    CONSENT_DECLINE: 'Not now',

    ADD_TODAY: 'Add for today only',
    NO_THANKS: 'No',
    // Es un dato (origen del ítem), no un texto que se vea: se queda igual en los dos idiomas.
    WEATHER_ITEM_ORIGIN: 'clima',

    UMBRELLA_LABEL: 'Umbrella',
    UMBRELLA_MESSAGE: 'It might rain today. Add “Umbrella”?',
  },
);
