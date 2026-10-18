import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Chip } from '@/components/atoms/Chip';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { Skeleton } from '@/components/atoms/Skeleton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { fadeIn } from '@/shared/theme/motion';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export type WeekSummaryCardState =
  | { kind: 'loading' }
  | { kind: 'empty'; message: string }
  | { kind: 'ready'; counts: string; generateLabel: string; onGenerate(): void }
  | { kind: 'generating'; label: string }
  | { kind: 'summary'; counts: string; resumen: string; recomendacion: string; sourceLabel: string; ai: boolean };

interface WeekSummaryCardProps {
  title: string;
  state: WeekSummaryCardState;
  /** Aviso informativo (ej. la IA no respondió y se muestra el resumen automático). */
  notice?: string | null;
}

/** Tarjeta "Tu semana" del Historial en sus estados: cargando, vacía, lista para generar, generando y con resumen. */
export function WeekSummaryCard({ title, state, notice }: WeekSummaryCardProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {state.kind === 'loading' || state.kind === 'generating' ? (
        <View style={styles.loading} accessible accessibilityLabel={state.kind === 'generating' ? state.label : title} accessibilityState={{ busy: true }}>
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="70%" />
          {state.kind === 'generating' ? (
            <Text style={styles.secondary} accessibilityLiveRegion="polite">
              {state.label}
            </Text>
          ) : null}
        </View>
      ) : null}
      {state.kind === 'empty' ? <Text style={styles.secondary}>{state.message}</Text> : null}
      {state.kind === 'ready' ? (
        <>
          <Text style={styles.secondary}>{state.counts}</Text>
          <SecondaryButton icon="sparkles-outline" label={state.generateLabel} onPress={state.onGenerate} />
        </>
      ) : null}
      {state.kind === 'summary' ? (
        <Animated.View entering={fadeIn} style={styles.summary} accessibilityLiveRegion="polite">
          <Text style={styles.secondary}>{state.counts}</Text>
          <Text style={styles.body}>{state.resumen}</Text>
          <View style={styles.recommendation}>
            <Ionicons name="bulb-outline" size={iconSizes.md} color={colors.primary} accessibilityElementsHidden importantForAccessibility="no" />
            <Text style={styles.bodyStrong}>{state.recomendacion}</Text>
          </View>
          <Chip tone="neutral" icon={state.ai ? 'sparkles-outline' : 'calculator-outline'} label={state.sourceLabel} />
        </Animated.View>
      ) : null}
      {notice ? <StatusMessage tone="info" message={notice} /> : null}
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    loading: {
      gap: spacing.sm,
    },
    summary: {
      gap: spacing.sm,
    },
    secondary: {
      ...typography.label,
      color: colors.textSecondary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
    bodyStrong: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flex: 1,
    },
    recommendation: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
  });
