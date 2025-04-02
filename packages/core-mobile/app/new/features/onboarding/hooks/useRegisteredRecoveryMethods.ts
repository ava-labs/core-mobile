import { Icons } from '@avalabs/k2-alpine'
import { useMemo } from 'react'
import { MFA } from 'seedless/types'
import { RecoveryMethod, RecoveryMethods } from './useAvailableRecoveryMethods'

export const useRegisteredRecoveryMethods = (
  mfas?: MFA[]
): RecoveryMethod[] => {
  return useMemo(() => {
    const recoveryMethods: RecoveryMethod[] = []

    if (mfas) {
      mfas.forEach(mfa => {
        if (mfa.type === 'totp') {
          recoveryMethods.push({
            type: RecoveryMethods.Authenticator,
            title: 'Authenticator',
            description: 'Use your authenticator app as your recovery method.',
            icon: Icons.RecoveryMethod.Authenticator,
            mfa
          })
        } else if (mfa.type === 'fido') {
          recoveryMethods.push({
            type: RecoveryMethods.Passkey,
            title: mfa.name,
            description:
              'Use your Passkey (or YubiKey) as your recovery method.',
            icon: Icons.RecoveryMethod.Passkey,
            mfa
          })
        }
      })
    }
    return recoveryMethods
  }, [mfas])
}
