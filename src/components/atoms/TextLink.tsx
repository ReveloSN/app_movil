import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, touchTarget, typography } from '@/shared/theme/tokens';

interface TextLinkProps {
  href: Href;
  label: string;
  /** Usa replace en vez de push (útil para alternar entre login y registro). */
  replace?: boolean;
}

export function TextLink({ href, label, replace = false }: TextLinkProps) {
  return (
    <Link href={href} replace={replace} asChild>
      <Pressable accessibilityRole="link" style={styles.target}>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  target: {
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.label,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
