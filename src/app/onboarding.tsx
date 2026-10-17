import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/atoms/ProgressBar';
import { TextButton } from '@/components/atoms/TextButton';
import { RequireSession } from '@/features/auth/RequireSession';
import { BACK_LABEL, SKIP_LABEL, stepProgressLabel, TOTAL_STEPS } from '@/features/onboarding/onboarding.copy';
import { DoneStep } from '@/features/onboarding/steps/DoneStep';
import { TemplateStep } from '@/features/onboarding/steps/TemplateStep';
import { TriggerStep } from '@/features/onboarding/steps/TriggerStep';
import { WelcomeStep } from '@/features/onboarding/steps/WelcomeStep';
import { useOnboardingFlow } from '@/features/onboarding/useOnboardingFlow';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

// Ancho fijo a cada lado de la barra de progreso: así queda centrada aunque falte "Atrás" o "Saltar".
const SIDE_WIDTH = 72;

function OnboardingFlow() {
  const styles = useThemedStyles(createStyles);
  const flow = useOnboardingFlow();
  const { step, back } = flow;
  const canGoBack = step === 2 || step === 3;

  // Android: el botón atrás retrocede un paso en vez de salir de la app.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack, back]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* 01-5 progreso y 01-6 saltar */}
      <View style={styles.topBar}>
        <View style={styles.side}>{canGoBack ? <TextButton label={BACK_LABEL} onPress={back} /> : null}</View>
        <View style={styles.progress}>
          <Text style={styles.progressText}>{stepProgressLabel(step)}</Text>
          <ProgressBar value={step} max={TOTAL_STEPS} accessibilityLabel={stepProgressLabel(step)} />
        </View>
        <View style={[styles.side, styles.sideEnd]}>
          {step < 4 ? <TextButton label={SKIP_LABEL} onPress={() => void flow.skip()} /> : null}
        </View>
      </View>

      {step === 1 ? <WelcomeStep onStart={() => flow.setStep(2)} /> : null}
      {step === 2 ? <TemplateStep onUse={flow.chooseTemplate} /> : null}
      {step === 3 && flow.template ? (
        <TriggerStep
          routineName={flow.template.name}
          formId={flow.formId}
          drafts={flow.drafts}
          suggestion={flow.suggestion}
          onConfigure={flow.configureTrigger}
          onCreate={() => void flow.createChosenRoutine()}
          creating={flow.creating}
          error={flow.error}
        />
      ) : null}
      {step === 4 ? (
        <DoneStep phrases={flow.createdPhrases} onContinue={() => void flow.goToRoutines()} continuing={flow.leaving} />
      ) : null}
    </SafeAreaView>
  );
}

/** P01: primer uso. Se llega desde OnboardingGate (pestañas) cuando corresponde. */
export default function OnboardingScreen() {
  return (
    <RequireSession>
      <OnboardingFlow />
    </RequireSession>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    side: {
      width: SIDE_WIDTH,
      alignItems: 'flex-start',
    },
    sideEnd: {
      alignItems: 'flex-end',
    },
    progress: {
      flex: 1,
      gap: spacing.xs,
    },
    progressText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
