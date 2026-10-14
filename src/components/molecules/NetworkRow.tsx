import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { TextButton } from '@/components/atoms/TextButton';
import { TextField } from '@/components/atoms/TextField';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface NetworkRowLabels {
  rename: string;
  remove: string;
  save: string;
  cancel: string;
}

interface NetworkRowProps {
  name: string;
  /** Nombre técnico de la red. */
  ssid: string;
  /** Ya formateados: "Última vez conectado: …", "La usa 1 aviso". */
  lastSeenText: string;
  usageText: string;
  labels: NetworkRowLabels;
  /** Modo renombrar: el campo reemplaza al nombre. */
  editing: boolean;
  draftName: string;
  nameMaxLength: number;
  nameError?: string;
  saving?: boolean;
  onChangeDraft(name: string): void;
  onStartRename(): void;
  onSaveRename(): void;
  onCancelRename(): void;
  onRemove(): void;
}

/** Red de casa en Ajustes (11-1): nombre, cuándo se usó y acciones. Solo props. */
export function NetworkRow(props: NetworkRowProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { labels } = props;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Ionicons name="wifi" size={iconSizes.lg} color={colors.primary} />
        {props.editing ? (
          <View style={styles.texts}>
            <TextField
              label={`Nombre de «${props.ssid}»`}
              value={props.draftName}
              onChangeText={props.onChangeDraft}
              maxLength={props.nameMaxLength}
              showCounter
              autoFocus
              error={props.nameError}
            />
          </View>
        ) : (
          <View
            style={styles.texts}
            accessible
            accessibilityLabel={`${props.name}, red ${props.ssid}. ${props.lastSeenText}. ${props.usageText}.`}
          >
            <Text style={styles.name}>{props.name}</Text>
            <Text style={styles.meta}>{props.ssid}</Text>
            <Text style={styles.meta}>{props.lastSeenText}</Text>
            <Text style={styles.meta}>{props.usageText}</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {props.editing ? (
          <>
            <TextButton label={labels.cancel} onPress={props.onCancelRename} disabled={props.saving} />
            <TextButton label={labels.save} onPress={props.onSaveRename} disabled={props.saving} />
          </>
        ) : (
          <>
            <TextButton label={labels.rename} onPress={props.onStartRename} />
            <TextButton label={labels.remove} tone="danger" onPress={props.onRemove} />
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    meta: {
      ...typography.label,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
  });
