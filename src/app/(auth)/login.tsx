import { router } from 'expo-router';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { PasswordField } from '@/components/molecules/PasswordField';
import * as copy from '@/features/auth/auth.copy';
import { useAuth } from '@/features/auth/AuthProvider';
import { WelcomeLayout } from '@/features/auth/components/WelcomeLayout';
import { useCredentialsForm } from '@/features/auth/useCredentialsForm';
import { useFocusFirstCredentialError } from '@/features/auth/useFocusFirstCredentialError';
import { useGuestSignIn } from '@/features/auth/useGuestSignIn';

const goHome = () => router.replace('/(tabs)');

/** Bienvenida: escena según la hora y la tarjeta de acceso (correo, invitado o registro). */
export default function LoginScreen() {
  const { signIn } = useAuth();
  const form = useCredentialsForm({
    enforcePasswordLength: false,
    submitAction: signIn,
    onSuccess: goHome,
  });
  const guest = useGuestSignIn(goHome);
  const busy = form.submitting || guest.submitting;
  const { emailRef, passwordRef, focusFirstError } = useFocusFirstCredentialError();

  async function submit() {
    focusFirstError(await form.submit());
  }

  return (
    <WelcomeLayout title="Iniciar sesión">
      <TextField
        ref={emailRef}
        icon="mail-outline"
        label={copy.EMAIL_LABEL}
        placeholder={copy.EMAIL_PLACEHOLDER}
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
      <PasswordField
        ref={passwordRef}
        label={copy.PASSWORD_LABEL}
        showLabel={copy.SHOW_PASSWORD}
        hideLabel={copy.HIDE_PASSWORD}
        value={form.password}
        onChangeText={form.setPassword}
        error={form.fieldErrors.password}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      {form.formError ? <StatusMessage tone="error" message={form.formError} /> : null}
      <PrimaryButton label="Entrar" onPress={() => void submit()} loading={form.submitting} disabled={guest.submitting} />
      {guest.error ? <StatusMessage tone="error" message={guest.error} /> : null}
      <SecondaryButton
        icon="person-outline"
        label={guest.submitting ? 'Entrando…' : 'Continuar sin cuenta'}
        onPress={guest.start}
        disabled={busy}
      />
      <TextLink href="/(auth)/register" label="¿No tienes cuenta? Regístrate" replace />
    </WelcomeLayout>
  );
}
