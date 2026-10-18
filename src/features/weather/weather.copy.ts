// Textos del clima. Sin código en el Documento de Contenido: propuestos, pendientes de validar.

export const WEATHER_SECTION_TITLE = 'Clima';
export const CITY_FIELD = 'Ciudad para el clima';
export const CITY_PLACEHOLDER = 'Ej. Bogotá';
export const SEARCH_LABEL = 'Buscar';
export const CHANGE_CITY_LABEL = 'Cambiar ciudad';
export const WEATHER_SWITCH = 'Sugerencias de clima';
export const WEATHER_HINT_NO_CITY = 'Elige una ciudad para activarlas.';
export const WEATHER_HINT = 'Si va a llover, te sugerimos el paraguas al verificar.';
export const WEATHER_ATTRIBUTION = 'Datos del clima: Open-Meteo.com';
export const cityLabel = (city: { name: string; region: string | null; country: string | null }) =>
  [city.name, city.region, city.country].filter(Boolean).join(', ');
export const useCityLabel = (label: string) => `Usar ${label}`;
export const NO_CITIES = 'No encontramos esa ciudad. Prueba con otro nombre.';
export const SEARCH_ERROR = 'No pudimos buscar la ciudad. Revisa tu conexión e inténtalo de nuevo.';
export const SAVE_ERROR = 'No se pudo guardar el cambio. Inténtalo de nuevo.';

// Aviso breve de privacidad (primera vez).
export const CONSENT_TITLE = 'Clima';
export const CONSENT_TEXT = 'Se envía la ciudad elegida a Open-Meteo para consultar el clima; no se envía nada más.';
export const CONSENT_ACCEPT = 'Entendido';
export const CONSENT_DECLINE = 'Ahora no';

// P07.
export const ADD_TODAY = 'Añadir solo hoy';
export const NO_THANKS = 'No';
export const WEATHER_ITEM_ORIGIN = 'clima';
