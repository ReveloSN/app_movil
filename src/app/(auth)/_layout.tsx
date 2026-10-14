import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/molecules/LoadingState';
import { useAuth } from '@/features/auth/AuthProvider';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;
  if (user) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
