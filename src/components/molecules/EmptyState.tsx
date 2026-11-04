import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { EmptyIllustration, type EmptyIllustrationKind } from '@/components/molecules/EmptyIllustration';
import { durations, fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface EmptyStateAction {
  label: string;
  onPress(): void;
  accessibilityHint?: string;
}

interface EmptyStateProps {
  message: string;
  /** Ilustración propia animada. Si falta, se dibuja el ícono (estados vacíos sencillos). */
  illustration?: EmptyIllustrationKind;
  /** Ícono simple cuando no hay ilustración. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Frase corta sobre el texto; opcional. */
  title?: string;
  /** Botón de salida (ej. "Ver plantillas"); opcional. */
  action?: EmptyStateAction;
  /** Dentro de una lista: no ocupa toda la pantalla. */
  inline?: boolean;
}

const iconEntering = ZoomIn.duration(durations.slow).reduceMotion(ReduceMotion.System);
const textEntering = FadeInUp.duration(durations.base).delay(80).reduceMotion(ReduceMotion.System);

export function EmptyState({ message, illustration, icon, title, action, inline = false }: EmptyStateProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  // Versión con ilustración: título (encabezado), texto y acción se leen en ese orden; la imagen se salta.
  if (illustration) {
    return (
      <Animated.View entering={fadeIn} style={[styles.container, inline && styles.inline]}>
        <EmptyIllustration kind={illustration} />
        <Animated.View entering={textEntering} style={styles.texts}>
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
        {action ? (
          <View style={styles.action}>
            <PrimaryButton label={action.label} onPress={action.onPress} accessibilityHint={action.accessibilityHint} />
          </View>
        ) : null}
      </Animated.View>
    );
  }

  return (
    // EV-01 / EV-02: el ícono entra con una escala suave y el texto lo sigue.
    <Animated.View entering={fadeIn} style={[styles.container, inline && styles.inline]} accessible accessibilityLabel={message}>
      {icon ? (
        <Animated.View entering={iconEntering}>
          <Ionicons name={icon} size={iconSizes.xl} color={colors.textSecondary} />
        </Animated.View>
      ) : null}
      <Animated.View entering={textEntering}>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = ({ colors, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.xxl,
      backgroundColor: colors.background,
    },
    inline: {
      flex: 0,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    texts: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    action: {
      alignSelf: 'stretch',
      // El botón mide 52 dp (+2 de hitSlop por lado): siempre >= 48.
      minHeight: sizes.secondaryRowHeight,
    },
  });
