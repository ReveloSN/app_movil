// Validación de la entrada (servidor). Rechaza, no recorta: la app ya respeta los límites.

import { AiError, INPUT_LIMITS, type AiRequest } from './contract.ts';
import { cleanText } from './text.ts';

const fail = (message: string): never => {
  throw new AiError('invalid_input', message);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function optionalText(value: unknown, field: string, max: number): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') fail(`"${field}" debe ser texto.`);
  const text = cleanText(value as string);
  if (text.length > max) fail(`"${field}" admite como máximo ${max} caracteres.`);
  return text;
}

function itemList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail('"items" debe ser una lista de textos.');
  const items = value as unknown[];
  if (items.length > INPUT_LIMITS.items) fail(`"items" admite como máximo ${INPUT_LIMITS.items} ítems.`);
  return items.map((item, index) => {
    if (typeof item !== 'string') fail(`"items[${index}]" debe ser texto.`);
    const text = cleanText(item as string);
    if (!text) fail(`"items[${index}]" está vacío.`);
    if (text.length > INPUT_LIMITS.itemLabel) fail(`"items[${index}]" admite como máximo ${INPUT_LIMITS.itemLabel} caracteres.`);
    return text;
  });
}

/** Entrada validada. Lanza AiError('invalid_input') con un mensaje que dice qué corregir. */
export function parseRequest(body: unknown): AiRequest {
  if (!isRecord(body)) return fail('El cuerpo debe ser un objeto JSON.');
  const { mode } = body;
  if (mode !== 'draft' && mode !== 'suggest') return fail('"mode" debe ser "draft" o "suggest".');

  const prompt = optionalText(body.prompt, 'prompt', INPUT_LIMITS.prompt);
  const name = optionalText(body.name, 'name', INPUT_LIMITS.name);
  const items = itemList(body.items);

  if (mode === 'draft') {
    if (!prompt) return fail('Para un borrador, "prompt" es obligatorio.');
    return { mode, prompt };
  }
  if (!name && items.length === 0) return fail('Para sugerir, envía "name" o al menos un ítem en "items".');
  return { mode, name, items };
}
