import { useState } from 'react';
import { Share, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';

import { encodeRoutineShare, type SharedRoutine } from './routine-share.codec';
import * as copy from './share.copy';

/** "Compartir rutina": arma el código de la copia y abre la hoja de compartir del sistema. */
export function ShareRoutineButton({ routine }: { routine: SharedRoutine }) {
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setError(null);
    try {
      await Share.share({ message: copy.shareMessage(routine.name, encodeRoutineShare(routine)) });
    } catch (cause) {
      if (__DEV__) console.warn('[routines.share]', cause);
      setError(copy.SHARE_ERROR);
    }
  }

  return (
    <View>
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <SecondaryButton icon="share-social-outline" label={copy.SHARE_LABEL} onPress={() => void share()} disabled={routine.items.length === 0} />
    </View>
  );
}
