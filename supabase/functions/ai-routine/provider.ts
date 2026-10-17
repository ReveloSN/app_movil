// Proveedor de IA (patrón Strategy). Para cambiar de proveedor se implementa esta interfaz
// (ej. groq.provider.ts o claude.provider.ts) y se elige en index.ts; nada más cambia.

export interface AiGeneration {
  /** Instrucciones del sistema (reglas, voz y formato). */
  system: string;
  /** Mensaje con el texto de la persona ya delimitado. */
  user: string;
  /** Esquema de la respuesta JSON (guía para el modelo; el servidor valida igual). */
  schema: Record<string, unknown>;
}

export interface AiProvider {
  readonly name: string;
  /**
   * Devuelve el texto JSON que generó el modelo. Lanza AiError('provider_timeout') si tarda
   * demasiado y AiError('provider_error') ante cualquier otro fallo del proveedor.
   */
  generate(request: AiGeneration): Promise<string>;
}
