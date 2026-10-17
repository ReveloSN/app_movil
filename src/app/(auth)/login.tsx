import { router } from 'expo-router';
import { useRef } from 'react';
import type { TextInput } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { AuthFormTemplate } from '@/components/templates/AuthFormTemplate';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCredentialsForm } from '@/features/auth/useCredentialsForm';
import { useGuestSignIn } from '@/features/auth/useGuestSignIn';

const goHome = () => router.replace('/(tabs)');

export default function LoginScreen() {
  const { signIn } = useAuth();
  const form = useCredentialsForm({
    enforcePasswordLength: false,
    submitAction: signIn,
    onSuccess: goHome,
  });
  const guest = useGuestSignIn(goHome);
  const busy = form.submitting || guest.submitting;

  // "Siguiente" en el correo lleva a la contraseña; "Ir" en la contraseña envía.
  const passwordRef = useRef<TextInput>(null);

  return (
    <AuthFormTemplate
      title="Iniciar sesión"
      footer={<TextLink href="/(auth)/register" label="¿No tienes cuenta? Regístrate" replace />}
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
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Contraseña"
        value={form.password}
        onChangeText={form.setPassword}
        error={form.fieldErrors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={form.submit}
      />
      {form.formError ? <StatusMessage tone="error" message={form.formError} /> : null}
      <PrimaryButton label="Entrar" onPress={form.submit} loading={form.submitting} disabled={guest.submitting} />
      {guest.error ? <StatusMessage tone="error" message={guest.error} /> : null}
      <SecondaryButton
        icon="person-outline"
        label={guest.submitting ? 'Entrando…' : 'Continuar sin cuenta'}
        onPress={guest.start}
        disabled={busy}
      />
    </AuthFormTemplate>
  );
}
