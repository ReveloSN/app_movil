/** Valor serializable como JSON (columnas jsonb). */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
