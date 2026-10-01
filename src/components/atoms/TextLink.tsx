import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface TextLinkProps {
  href: Href;
  label: string;
  /** Usa replace en vez de push (útil para alternar entre login y registro). */
  replace?: boolean;
}

export function TextLink({ href, label, replace = false }: TextLinkProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Link href={href} replace={replace} asChild>
      <Pressable accessibilityRole="link" style={styles.target}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const createStyles = ({ colors, sizes, typography }: AppTheme) =>
  StyleSheet.create({
    target: {
      minHeight: sizes.secondaryRowHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.labelMedium,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
  });
