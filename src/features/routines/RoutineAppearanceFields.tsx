import { SectionLabel } from '@/components/atoms/SectionLabel';
import { ColorPicker } from '@/components/molecules/ColorPicker';
import { IconPicker } from '@/components/molecules/IconPicker';
import { useAppTheme } from '@/shared/theme/useAppTheme';

import { resolveRoutineColor, resolveRoutineIcon, ROUTINE_COLORS, ROUTINE_ICONS } from './routine-appearance';
import * as copy from './routine.copy';

interface RoutineAppearanceFieldsProps {
  icon: string;
  color: string;
  onIconChange(icon: string): void;
  onColorChange(color: string): void;
}

/** 04-2 en P04: ícono y color de la rutina (el ícono elegido se pinta con el color). */
export function RoutineAppearanceFields({ icon, color, onIconChange, onColorChange }: RoutineAppearanceFieldsProps) {
  const { colors } = useAppTheme();
  return (
    <>
      <SectionLabel label={copy.ICON_LABEL} />
      <IconPicker
        accessibilityLabel={copy.ICON_LABEL}
        options={ROUTINE_ICONS}
        value={resolveRoutineIcon(icon)}
        onChange={onIconChange}
        accentColor={colors[resolveRoutineColor(color).token]}
      />
      <SectionLabel label={copy.COLOR_LABEL} />
      <ColorPicker
        accessibilityLabel={copy.COLOR_LABEL}
        options={ROUTINE_COLORS.map((option) => ({ key: option.key, label: option.label, color: colors[option.token] }))}
        value={resolveRoutineColor(color).key}
        onChange={onColorChange}
      />
    </>
  );
}
