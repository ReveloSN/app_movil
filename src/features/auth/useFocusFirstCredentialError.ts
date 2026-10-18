import { useRef } from 'react';
import { AccessibilityInfo, type TextInput } from 'react-native';

import type { CredentialErrors } from './auth.validation';

/** Tras un intento con errores, lleva el foco al primer campo mal y lo anuncia al lector de pantalla. */
export function useFocusFirstCredentialError() {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function focusFirstError(errors: CredentialErrors) {
    const first = errors.email ? { ref: emailRef, message: errors.email } : errors.password ? { ref: passwordRef, message: errors.password } : null;
    if (!first) return;
    first.ref.current?.focus();
    AccessibilityInfo.announceForAccessibility(first.message);
  }

  return { emailRef, passwordRef, focusFirstError };
}
