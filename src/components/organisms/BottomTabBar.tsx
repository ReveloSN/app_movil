import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/atoms/TabBarIcon';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

export interface BottomTabItem {
  key: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

interface BottomTabBarProps {
  items: readonly BottomTabItem[];
  selectedIndex: number;
  onSelect(index: number): void;
}

const ICON_SIZE = 24;

/**
 * Barra de pestañas inferior: ícono (lleno y con píldora en la activa) y texto. Sigue siendo tocable
 * aunque las pestañas también se cambien deslizando.
 */
export function BottomTabBar({ items, selectedIndex, onSelect }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: bottom }]} accessibilityRole="tablist">
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        const color = selected ? colors.primary : colors.textSecondary;
        return (
          <Pressable
            key={item.key}
            testID={`tab-${item.key}`}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(index)}
            style={styles.item}
          >
            <TabBarIcon icon={item.icon} activeIcon={item.activeIcon} focused={selected} color={color} size={ICON_SIZE} />
            <Text style={[styles.label, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    item: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      // Mismo alto que la barra anterior (49 dp, área táctil ≥ 48); con letra grande, crece.
      minHeight: sizes.tabBarHeight,
      paddingTop: spacing.xs,
      paddingBottom: 1,
    },
    label: {
      ...typography.caption,
    },
  });
