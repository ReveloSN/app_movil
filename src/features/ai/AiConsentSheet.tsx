import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { TextButton } from '@/components/atoms/TextButton';
import { useBottomInset } from '@/shared/hooks/useBottomInset';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { IoniconName } from '@/shared/utils/ioniconName';

import * as copy from './ai.copy';

interface AiConsentSheetProps {
  visible: boolean;
  onAccept(): void;
  onDecline(): void;
}

/** Aviso de privacidad de primer uso (tono Permisos): qué se envía, qué no y quién lo procesa. */
export function AiConsentSheet({ visible, onAccept, onDecline }: AiConsentSheetProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const bottomInset = useBottomInset();

  const point = (icon: IoniconName, text: string) => (
    <View style={styles.point}>
      <Ionicons name={icon} size={iconSizes.md} color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDecline} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { paddingBottom: styles.sheet.padding + bottomInset }]} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {copy.CONSENT_TITLE}
          </Text>
          {point('text-outline', copy.CONSENT_SENT)}
          {point('location-outline', copy.CONSENT_NOT_SENT)}
          {point('information-circle-outline', copy.CONSENT_PROVIDER)}
          <View style={styles.actions}>
            <PrimaryButton label={copy.CONSENT_ACCEPT} onPress={onAccept} />
            <TextButton label={copy.CONSENT_DECLINE} onPress={onDecline} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.scrim,
    },
    sheet: {
      gap: spacing.lg,
      padding: spacing.xl,
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      backgroundColor: colors.surface,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    point: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    text: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    actions: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
  });
