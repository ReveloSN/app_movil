import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

const keyFor = (userId: string) => `onboarding-done:${userId}`;

/** true si este usuario ya terminó o saltó el onboarding en este teléfono. */
export async function hasFinishedOnboarding(userId: string, storage: KeyValueStorage = AsyncStorage): Promise<boolean> {
  return (await storage.getItem(keyFor(userId))) === 'true';
}

export const markOnboardingFinished = (userId: string, storage: KeyValueStorage = AsyncStorage) =>
  storage.setItem(keyFor(userId), 'true');
