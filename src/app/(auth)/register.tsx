import { router } from 'expo-router';
import { useState } from 'react';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { PasswordField } from '@/components/molecules/PasswordField';
import copy from '@/features/auth/auth.copy';
import { useAuth } from '@/features/auth/AuthProvider';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/auth.validation';
import { WelcomeLayout } from '@/features/auth/components/WelcomeLayout';
import { useCredentialsForm } from '@/features/auth/useCredentialsForm';
import { useFocusFirstCredentialError } from '@/features/auth/useFocusFirstCredentialError';

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
  const { emailRef, passwordRef, focusFirstError } = useFocusFirstCredentialError();

  async function submit() {
    focusFirstError(await form.submit());
  }

  return (
    <WelcomeLayout title={copy.REGISTER_TITLE}>
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
        placeholder={copy.passwordMinPlaceholder(MIN_PASSWORD_LENGTH)}
        value={form.password}
        onChangeText={form.setPassword}
        error={form.fieldErrors.password}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      {form.formError ? <StatusMessage tone="error" message={form.formError} /> : null}
      {confirmationSent ? (
        <StatusMessage tone="info" message={copy.CONFIRMATION_SENT} />
      ) : null}
      <PrimaryButton label={copy.REGISTER_SUBMIT} onPress={() => void submit()} loading={form.submitting} />
      <TextLink href="/(auth)/login" label={copy.GO_TO_LOGIN_LABEL} replace />
    </WelcomeLayout>
  );
}
