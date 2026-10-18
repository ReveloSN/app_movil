// Compartir una rutina como COPIA: un código de texto que se envía con la hoja de compartir del sistema
// y se pega en otro teléfono. Solo lleva lo mínimo (nombre, ícono, color e ítems con tipo y crítico):
// ni avisos, ni redes, ni historial, ni datos de la persona. Sin servidor ni módulos nativos.
//
// Formato: "VS1:" + base64url(JSON) + "." + suma de comprobación (FNV-1a, 8 hex) del JSON.
// JSON: { v: 1, n: nombre, i: ícono, c: color, t: [[etiqueta, tipo 0|1|2, crítico 0|1], …] }

import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS, MIN_ITEMS, ROUTINE_NAME_MAX_LENGTH } from '@/features/routines/routine.validation';
import { DEFAULT_ROUTINE_COLOR, DEFAULT_ROUTINE_ICON, ROUTINE_COLORS, ROUTINE_ICONS } from '@/features/routines/routine-appearance';
import type { ItemDraft, ItemKind, RoutineDraft } from '@/features/routines/routines.types';

const PREFIX = 'VS1:';
const VERSION = 1;
const KINDS: readonly ItemKind[] = ['carry', 'do', 'check'];
/** Un código con 12 ítems de 32 caracteres cabe de sobra; más largo es otra cosa. */
export const MAX_CODE_LENGTH = 2400;

export type ShareErrorKind = 'empty' | 'not_found' | 'too_long' | 'corrupt' | 'checksum' | 'version' | 'invalid';

export class ShareCodeError extends Error {
  constructor(readonly kind: ShareErrorKind) {
    super(`share:${kind}`);
    this.name = 'ShareCodeError';
  }
}

/** Lo que se comparte: la forma de una rutina, sin ids ni avisos. */
export type SharedRoutine = Required<Pick<RoutineDraft, 'name' | 'icon' | 'color'>> & { items: Pick<ItemDraft, 'label' | 'kind' | 'critical'>[] };

// --- UTF-8 y base64url propios (no dependen de TextEncoder ni de btoa) ---

function utf8Encode(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) as number;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let text = '';
  for (let i = 0; i < bytes.length; ) {
    const byte = bytes[i];
    const size = byte < 0x80 ? 1 : byte >> 5 === 6 ? 2 : byte >> 4 === 14 ? 3 : byte >> 3 === 30 ? 4 : 0;
    if (!size || i + size > bytes.length) throw new ShareCodeError('corrupt');
    let code = size === 1 ? byte : byte & (0xff >> (size + 1));
    for (let j = 1; j < size; j += 1) {
      if (bytes[i + j] >> 6 !== 2) throw new ShareCodeError('corrupt');
      code = (code << 6) | (bytes[i + j] & 63);
    }
    text += String.fromCodePoint(code);
    i += size;
  }
  return text;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function base64urlEncode(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = bytes.slice(i, i + 3);
    const chunk = (a << 16) | (b << 8) | c;
    const chars = [18, 12, 6, 0].map((shift) => ALPHABET[(chunk >> shift) & 63]);
    out += chars.slice(0, Math.ceil(((Math.min(3, bytes.length - i)) * 8) / 6)).join('');
  }
  return out;
}

function base64urlDecode(text: string): number[] {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) throw new ShareCodeError('corrupt');
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    const group = text.slice(i, i + 4);
    const values = [...group].map((char) => ALPHABET.indexOf(char));
    const chunk = values.reduce((acc, value, index) => acc | (value << (18 - index * 6)), 0);
    const count = group.length - 1;
    for (let j = 0; j < count; j += 1) bytes.push((chunk >> (16 - j * 8)) & 0xff);
  }
  return bytes;
}

/** Suma de comprobación FNV-1a (32 bits): detecta un código cortado o mal copiado (no es seguridad). */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (const byte of utf8Encode(text)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// --- Validación ---

// Control, invisibles y marcas de dirección (texto que engaña a la vista): se rechazan.
const CONTROL = new RegExp('[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]');

function cleanLabel(value: unknown, max: number): string {
  if (typeof value !== 'string' || CONTROL.test(value)) throw new ShareCodeError('invalid');
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text || text.length > max) throw new ShareCodeError('invalid');
  return text;
}

function toSharedRoutine(data: unknown): SharedRoutine {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ShareCodeError('invalid');
  const raw = data as Record<string, unknown>;
  if (raw.v !== VERSION) throw new ShareCodeError('version');
  if (!Array.isArray(raw.t) || raw.t.length < MIN_ITEMS || raw.t.length > MAX_ITEMS) throw new ShareCodeError('invalid');
  const items = raw.t.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 3) throw new ShareCodeError('invalid');
    const [label, kind, critical] = entry as unknown[];
    if (kind !== 0 && kind !== 1 && kind !== 2) throw new ShareCodeError('invalid');
    if (critical !== 0 && critical !== 1) throw new ShareCodeError('invalid');
    return { label: cleanLabel(label, ITEM_LABEL_MAX_LENGTH), kind: KINDS[kind], critical: critical === 1 };
  });
  return {
    name: cleanLabel(raw.n, ROUTINE_NAME_MAX_LENGTH),
    // Ícono y color fuera del conjunto de la app: los de por defecto (no se rechaza por algo cosmético).
    icon: ROUTINE_ICONS.find((option) => option.icon === raw.i)?.icon ?? DEFAULT_ROUTINE_ICON,
    color: ROUTINE_COLORS.find((option) => option.key === raw.c)?.key ?? DEFAULT_ROUTINE_COLOR,
    items,
  };
}

/** Código para compartir. La rutina ya cumple los límites de la app (se valida igual al importarla). */
export function encodeRoutineShare(routine: SharedRoutine): string {
  const json = JSON.stringify({
    v: VERSION,
    n: routine.name.trim(),
    i: routine.icon,
    c: routine.color,
    t: routine.items.map((item) => [item.label.trim(), KINDS.indexOf(item.kind) >= 0 ? KINDS.indexOf(item.kind) : 0, item.critical ? 1 : 0]),
  });
  return `${PREFIX}${base64urlEncode(utf8Encode(json))}.${checksum(json)}`;
}

/** Lee un código pegado (aunque venga dentro del mensaje con texto alrededor). Lanza ShareCodeError. */
export function decodeRoutineShare(input: string): SharedRoutine {
  const text = input.trim();
  if (!text) throw new ShareCodeError('empty');
  if (text.length > MAX_CODE_LENGTH * 2) throw new ShareCodeError('too_long');
  const match = /VS(\d+):([A-Za-z0-9_-]+)\.([0-9a-f]{8})/.exec(text);
  if (!match) throw new ShareCodeError('not_found');
  if (match[1] !== String(VERSION)) throw new ShareCodeError('version');
  if (match[0].length > MAX_CODE_LENGTH) throw new ShareCodeError('too_long');
  const json = utf8Decode(base64urlDecode(match[2]));
  if (checksum(json) !== match[3]) throw new ShareCodeError('checksum');
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new ShareCodeError('corrupt');
  }
  return toSharedRoutine(data);
}
