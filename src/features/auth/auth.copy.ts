// Textos de acceso y registro sin código en el Documento de Contenido: propuestos, pendientes de validar.

import { localized } from '@/shared/i18n/localized';

export default localized(
  {
    EMAIL_LABEL: 'Correo',
    EMAIL_PLACEHOLDER: 'tu@correo.com',
    PASSWORD_LABEL: 'Contraseña',
    SHOW_PASSWORD: 'Mostrar contraseña',
    HIDE_PASSWORD: 'Ocultar contraseña',

    // Pantallas de acceso y registro.
    LOGIN_TITLE: 'Iniciar sesión',
    LOGIN_SUBMIT: 'Entrar',
    GUEST_LABEL: 'Continuar sin cuenta',
    GUEST_LOADING_LABEL: 'Entrando…',
    GO_TO_REGISTER_LABEL: '¿No tienes cuenta? Regístrate',
    REGISTER_TITLE: 'Crear cuenta',
    REGISTER_SUBMIT: 'Crear cuenta',
    GO_TO_LOGIN_LABEL: '¿Ya tienes cuenta? Inicia sesión',
    passwordMinPlaceholder: (min: number) => `Mínimo ${min} caracteres`,
    CONFIRMATION_SENT: 'Te enviamos un correo de confirmación. Ábrelo y luego inicia sesión.',

    // Validación de los campos.
    EMAIL_REQUIRED: 'Escribe tu correo.',
    EMAIL_INVALID: 'Escribe un correo válido.',
    PASSWORD_REQUIRED: 'Escribe tu contraseña.',
    passwordTooShort: (min: number) => `La contraseña debe tener al menos ${min} caracteres.`,

    // Errores de Supabase Auth que ve la persona.
    ERROR_INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    ERROR_EMAIL_NOT_CONFIRMED: 'Confirma tu correo antes de iniciar sesión.',
    ERROR_ACCOUNT_EXISTS: 'Ya existe una cuenta con ese correo.',
    ERROR_WEAK_PASSWORD: 'La contraseña es demasiado débil.',
    ERROR_RATE_LIMIT: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    ERROR_ANONYMOUS_DISABLED: 'El acceso sin cuenta no está disponible en este momento.',
    ERROR_FALLBACK: 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.',
    ERROR_GUEST_OFFLINE: 'La primera vez necesitas internet para crear tu espacio. Después la app funciona sin conexión.',

    // Escena de Bienvenida (voz y tono: docs/ux/01-contenido.md §02; propuestos, pendientes de validar).
    SCENE_ALT: 'Paisaje que cambia con la hora del día: una casa con sol o luna',
    demoLabel: (hour: string) => `Demostración · ${hour}`,
    sceneHeadlines: {
      morning: { title: 'Antes de cruzar la puerta', subtitle: 'Revisa en segundos lo que no puede faltar.' },
      midday: { title: 'Lo importante, contigo', subtitle: 'Rutinas cortas que aparecen solas.' },
      evening: { title: '¿Vas saliendo?', subtitle: 'Llaves, cargador y estufa, en una lista.' },
      night: { title: 'Cierra el día con calma', subtitle: 'Puerta, gas y alarma, revisados.' },
    },
  },
  {
    EMAIL_LABEL: 'Email',
    EMAIL_PLACEHOLDER: 'you@email.com',
    PASSWORD_LABEL: 'Password',
    SHOW_PASSWORD: 'Show password',
    HIDE_PASSWORD: 'Hide password',

    LOGIN_TITLE: 'Sign in',
    LOGIN_SUBMIT: 'Sign in',
    GUEST_LABEL: 'Continue without an account',
    GUEST_LOADING_LABEL: 'Signing in…',
    GO_TO_REGISTER_LABEL: "Don't have an account? Sign up",
    REGISTER_TITLE: 'Create account',
    REGISTER_SUBMIT: 'Create account',
    GO_TO_LOGIN_LABEL: 'Already have an account? Sign in',
    passwordMinPlaceholder: (min: number) => `At least ${min} characters`,
    CONFIRMATION_SENT: 'We sent you a confirmation email. Open it, then sign in.',

    EMAIL_REQUIRED: 'Enter your email.',
    EMAIL_INVALID: 'Enter a valid email.',
    PASSWORD_REQUIRED: 'Enter your password.',
    passwordTooShort: (min: number) => `Your password must be at least ${min} characters.`,

    ERROR_INVALID_CREDENTIALS: 'Incorrect email or password.',
    ERROR_EMAIL_NOT_CONFIRMED: 'Confirm your email before signing in.',
    ERROR_ACCOUNT_EXISTS: 'An account with that email already exists.',
    ERROR_WEAK_PASSWORD: 'That password is too weak.',
    ERROR_RATE_LIMIT: 'Too many attempts. Wait a moment and try again.',
    ERROR_ANONYMOUS_DISABLED: 'Using the app without an account is not available right now.',
    ERROR_FALLBACK: "We couldn't complete that. Check your connection and try again.",
    ERROR_GUEST_OFFLINE: 'The first time, you need internet to set up your space. After that, the app works offline.',

    SCENE_ALT: 'A landscape that changes with the time of day: a house with the sun or the moon',
    demoLabel: (hour: string) => `Demo · ${hour}`,
    sceneHeadlines: {
      morning: { title: 'Before you step out', subtitle: "Check in seconds what can't be left behind." },
      midday: { title: 'What matters, with you', subtitle: 'Short routines that show up on their own.' },
      evening: { title: 'Heading out?', subtitle: 'Keys, charger and stove, in one list.' },
      night: { title: 'Close the day calmly', subtitle: 'Door, gas and alarm, all checked.' },
    },
  },
);
