import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomInset } from '@/shared/hooks/useBottomInset';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { SkyHouseScene } from './SkyHouseScene';

/** La tarjeta sube sobre el 12 % inferior de la escena (el jardín). */
const CARD_OVERLAP = 0.12;

interface WelcomeLayoutProps {
  title: string;
  /** Campos, mensajes y acciones. */
  children: ReactNode;
}

/**
 * Bienvenida (acceso y registro): la escena arriba, detrás de la barra de estado, y una tarjeta que sube
 * sobre ella con el formulario. Todo hace scroll: ni el teclado ni la barra del sistema tapan un campo.
 * La escena sigue la hora; la tarjeta, el tema claro u oscuro.
 */
export function WelcomeLayout({ title, children }: WelcomeLayoutProps) {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomInset();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: bottomInset + styles.card.padding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SkyHouseScene topInset={top} />
        <View style={[styles.card, { marginTop: -Math.round(width * CARD_OVERLAP) }]}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      gap: spacing.lg,
      padding: spacing.xl,
      borderTopLeftRadius: radii.xxl + spacing.sm,
      borderTopRightRadius: radii.xxl + spacing.sm,
      backgroundColor: colors.surface,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
  });
