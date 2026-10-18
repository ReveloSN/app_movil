import { useCallback, useState } from 'react';

import { useToast } from '@/features/feedback/toast.context';
import { closeTo } from '@/features/forms/useCloseAfterSave';
import { useRoutines } from '@/features/routines/useRoutines';

import { decodeRoutineShare, ShareCodeError, type SharedRoutine } from './routine-share.codec';
import * as copy from './share.copy';

/**
 * "Importar rutina": pegar el código, revisar la vista previa y añadir una COPIA nueva (id nuevo, sin
 * avisos). Si el código no sirve, el error dice qué hacer; si guardar falla, la pantalla no se cierra.
 */
export function useImportRoutine() {
  const { createRoutine } = useRoutines();
  const toast = useToast();
  const [code, setCodeState] = useState('');
  const [preview, setPreview] = useState<SharedRoutine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setCode = useCallback((value: string) => {
    setCodeState(value);
    setPreview(null);
    setError(null);
  }, []);

  const review = useCallback(() => {
    try {
      setPreview(decodeRoutineShare(code));
      setError(null);
    } catch (cause) {
      setPreview(null);
      setError(copy.IMPORT_ERRORS[cause instanceof ShareCodeError ? cause.kind : 'invalid']);
    }
  }, [code]);

  const add = useCallback(async () => {
    if (!preview || saving) return;
    setSaving(true);
    setError(null);
    const result = await createRoutine({ name: preview.name, icon: preview.icon, color: preview.color, items: preview.items });
    setSaving(false);
    if (result.status === 'saved') {
      toast.show(copy.IMPORTED);
      closeTo('home');
    } else {
      setError(result.status === 'failed' ? result.error : copy.IMPORT_ERRORS.invalid);
    }
  }, [preview, saving, createRoutine, toast]);

  return { code, setCode, preview, error, saving, review, add };
}
