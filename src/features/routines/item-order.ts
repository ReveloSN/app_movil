/** "El ítem crítico sube en la lista": críticos primero, cada grupo en su orden original (estable). */
export const sortCriticalFirst = <T extends { critical: boolean }>(items: readonly T[]): T[] => [
  ...items.filter((item) => item.critical),
  ...items.filter((item) => !item.critical),
];
