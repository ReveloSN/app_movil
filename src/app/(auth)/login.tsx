import { router } from 'expo-router';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { AuthFormTemplate } from '@/components/templates/AuthFormTemplate';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCredentialsForm } from '@/features/auth/useCredentialsForm';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const form = useCredentialsForm({
    enforcePasswordLength: false,
    submitAction: signIn,
    onSuccess: () => router.replace('/(tabs)'),
  });

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
      />
      <TextField
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
      <PrimaryButton label="Entrar" onPress={form.submit} loading={form.submitting} />
    </AuthFormTemplate>
  );
}
