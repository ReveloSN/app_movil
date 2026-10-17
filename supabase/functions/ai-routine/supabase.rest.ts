// Llamadas a Supabase con fetch (sin el SDK ni imports npm:): usuario de la sesión y cuota.

export interface SupabaseKeys {
  url: string;
  /** Clave publicable (o la anon heredada): para preguntar quién es el usuario del JWT. */
  publishableKey: string;
  /** Clave secreta (o la service role heredada): para la función SQL de la cuota. */
  secretKey: string;
}

/** Las claves nuevas vienen como JSON {"default": "..."}; las heredadas, como texto. */
export function pickKey(dictionary: string | undefined, legacy: string | undefined): string {
  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary) as Record<string, unknown>;
      const value = parsed.default ?? Object.values(parsed)[0];
      if (typeof value === 'string' && value) return value;
    } catch {
      // Se usa la heredada.
    }
  }
  return legacy ?? '';
}

/** Cabeceras para la API de Supabase: las claves heredadas (JWT) van también como Bearer. */
const apiHeaders = (key: string): Record<string, string> => ({
  apikey: key,
  ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
});

/** Id del usuario dueño del JWT (los invitados anónimos también tienen uno), o null si no es válido. */
export async function userIdFromJwt(keys: SupabaseKeys, authorization: string | null, doFetch: typeof fetch = fetch): Promise<string | null> {
  if (!authorization?.startsWith('Bearer ')) return null;
  const response = await doFetch(`${keys.url}/auth/v1/user`, {
    headers: { apikey: keys.publishableKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as { id?: unknown } | null;
  return typeof user?.id === 'string' ? user.id : null;
}

/** Suma una llamada del día; true si cabía en el límite (función SQL atómica consume_ai_quota). */
export async function consumeAiQuota(keys: SupabaseKeys, userId: string, limit: number, doFetch: typeof fetch = fetch): Promise<boolean> {
  const response = await doFetch(`${keys.url}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST',
    headers: { ...apiHeaders(keys.secretKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_user_id: userId, p_limit: limit }),
  });
  if (!response.ok) throw new Error(`consume_ai_quota respondió ${response.status}`);
  const calls: unknown = await response.json();
  return typeof calls === 'number';
}
