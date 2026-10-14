import type { ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { TemplateCard } from '@/components/molecules/TemplateCard';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { itemCountLabel, suggestedTriggerLabel, USE_TEMPLATE_LABEL } from './routine-templates.copy';
import { PRESET_TEMPLATES } from './routine-templates.data';
import type { PresetTemplate } from './routine-templates.types';

interface TemplateListProps {
  /** Qué hacer al tocar "Usar plantilla" (P10 abre P04; el onboarding avanza al aviso). */
  onUse(template: PresetTemplate): void;
  /** Contenido sobre la lista (ej. título del paso del onboarding). */
  header?: ReactElement;
}

/** Plantillas precargadas (P10), cada una con "Usar plantilla". */
export function TemplateList({ onUse, header }: TemplateListProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <FlatList
      data={PRESET_TEMPLATES}
      keyExtractor={(template) => template.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TemplateCard
          name={item.name}
          description={item.description}
          icon={item.icon}
          itemCountLabel={itemCountLabel(item.items.length)}
          triggerLabel={suggestedTriggerLabel(item.suggestedTrigger)}
          actionLabel={USE_TEMPLATE_LABEL}
          onAction={() => onUse(item)}
        />
      )}
    />
  );
}

const createStyles = ({ spacing }: AppTheme) =>
  StyleSheet.create({
    list: {
      gap: spacing.md,
      padding: spacing.xl,
    },
  });
