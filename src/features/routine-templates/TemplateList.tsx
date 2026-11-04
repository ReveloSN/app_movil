import type { ReactElement } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { TemplateCard } from '@/components/molecules/TemplateCard';
import { routineAccent } from '@/features/routines/routine-appearance';
import { useScrollEndPadding } from '@/shared/hooks/useScrollEndPadding';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { itemCountLabel, suggestedTriggerLabel, USE_TEMPLATE_LABEL } from './routine-templates.copy';
import { PRESET_TEMPLATES } from './routine-templates.data';
import type { PresetTemplate } from './routine-templates.types';

interface TemplateListProps {
  /** Qué hacer al tocar "Usar plantilla" (P10 abre P04; el onboarding avanza al aviso). */
  onUse(template: PresetTemplate): void;
  /** Contenido sobre la lista (ej. título del paso del onboarding). */
  header?: ReactElement;
  /** Oculta las plantillas de llegada (el onboarding crea la primera rutina de salida). */
  departuresOnly?: boolean;
}

/** Plantillas precargadas (P10), cada una con "Usar plantilla". */
export function TemplateList({ onUse, header, departuresOnly = false }: TemplateListProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const endPadding = useScrollEndPadding();

  return (
    <FlatList
      data={departuresOnly ? PRESET_TEMPLATES.filter((template) => template.kind !== 'arrival') : PRESET_TEMPLATES}
      keyExtractor={(template) => template.id}
      contentContainerStyle={[styles.list, endPadding]}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TemplateCard
          name={item.name}
          description={item.description}
          icon={item.icon}
          accentColor={routineAccent(colors, item.color).color}
          accentTint={routineAccent(colors, item.color).tint}
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
