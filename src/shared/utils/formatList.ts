/**
 * Lista en español: "A", "A y B", "A, B y C". Con más de `maxListed`: "A, B, C y 2 más".
 */
export function formatList(labels: readonly string[], maxListed = Infinity): string {
  if (labels.length <= 1) return labels.join('');
  if (labels.length <= maxListed) return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
  return `${labels.slice(0, maxListed).join(', ')} y ${labels.length - maxListed} más`;
}
