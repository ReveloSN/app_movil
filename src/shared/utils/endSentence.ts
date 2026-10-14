/** Cierra una oración con punto, sin duplicarlo si ya termina en uno (ej. "6:00 p. m."). */
export const endSentence = (text: string) => (text.endsWith('.') ? text : `${text}.`);
