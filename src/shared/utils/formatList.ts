import { getLocale } from '@/shared/i18n/locale.store';

/**
 * Lista según el idioma: "A", "A y B", "A, B y C" (inglés: "A and B", "A, B and C"). Con más de `maxListed`:
 * "A, B, C y 2 más" (inglés: "A, B, C and 2 more").
 */
export function formatList(labels: readonly string[], maxListed = Infinity): string {
  const [and, more] = getLocale() === 'en' ? ['and', 'more'] : ['y', 'más'];
  if (labels.length <= 1) return labels.join('');
  if (labels.length <= maxListed) return `${labels.slice(0, -1).join(', ')} ${and} ${labels[labels.length - 1]}`;
  return `${labels.slice(0, maxListed).join(', ')} ${and} ${labels.length - maxListed} ${more}`;
}
