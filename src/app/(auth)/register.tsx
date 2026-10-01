import { router } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { AuthFormTemplate } from '@/components/templates/AuthFormTemplate';
import { useAuth } from '@/features/auth/AuthProvider';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/auth.validation';
import { useCredentialsForm } from '@/features/auth/useCredentialsForm';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [confirmationSent, setConfirmationSent] = useState(false);
  const form = useCredentialsForm({
    enforcePasswordLength: true,
    submitAction: signUp,
    onSuccess: ({ needsEmailConfirmation }) => {
      if (needsEmailConfirmation) setConfirmationSent(true);
      else router.replace('/(tabs)');
    },
  });

  return (
    <AuthFormTemplate
      title="Crear cuenta"
      footer={<TextLink href="/(auth)/login" label="¿Ya tienes cuenta? Inicia sesión" replace />}
    >
      <TextField
        label="Correo"
        value={form.email}
        onChangeText={form.setEmail}
        error={form.fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
        value={form.password}
        onChangeText={form.setPassword}
        error={form.fieldErrors.password}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={form.submit}
      />
      {form.formError ? <StatusMessage tone="error" message={form.formError} /> : null}
      {confirmationSent ? (
        <StatusMessage tone="info" message="Te enviamos un correo de confirmación. Ábrelo y luego inicia sesión." />
      ) : null}
      <PrimaryButton label="Crear cuenta" onPress={form.submit} loading={form.submitting} />
    </AuthFormTemplate>
  );
}
