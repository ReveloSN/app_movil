import { useState, type ComponentProps } from 'react';

import { IconButton } from '@/components/atoms/IconButton';
import { TextField } from '@/components/atoms/TextField';

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'secureTextEntry' | 'icon' | 'trailing'> & {
  /** Textos del botón del ojo (área táctil de 48 dp). */
  showLabel: string;
  hideLabel: string;
};

/** Campo de contraseña con candado y un botón para mostrarla u ocultarla. */
export function PasswordField({ showLabel, hideLabel, ...fieldProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...fieldProps}
      icon="lock-closed-outline"
      secureTextEntry={!visible}
      trailing={
        <IconButton
          icon={visible ? 'eye-off-outline' : 'eye-outline'}
          accessibilityLabel={visible ? hideLabel : showLabel}
          onPress={() => setVisible((current) => !current)}
        />
      }
    />
  );
}
