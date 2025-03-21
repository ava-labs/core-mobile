import { useSelector } from 'react-redux'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import { Icons } from '@avalabs/k2-alpine'
import { FC, useMemo } from 'react'
import { SvgProps } from 'react-native-svg'
import PasskeyService from 'services/passkey/PasskeyService'
import { MFA } from 'seedless/types'

export enum RecoveryMethods {
  Passkey = 'passkey',
  Authenticator = 'authenticator',
  Yubikey = 'yubikey'
}

export type RecoveryMethod = {
  type: RecoveryMethods
  title: string
  description: string
  icon: FC<SvgProps>
  mfa?: MFA
}
export const RECOVERY_METHODS: RecoveryMethod[] = [
  {
    type: RecoveryMethods.Passkey,
    title: 'Passkey',
    description: 'Add a Passkey as a recovery method.',
    icon: Icons.RecoveryMethod.Passkey
  },
  {
    type: RecoveryMethods.Authenticator,

    title: 'Authenticator app',
    description: 'Add an Authenticator app as a recovery method.',
    icon: Icons.RecoveryMethod.Authenticator
  },
  {
    type: RecoveryMethods.Yubikey,
    title: 'Yubikey',
    description: 'Add a YubiKey as a recovery method.',
    icon: Icons.RecoveryMethod.Yubikey
  }
]

export const useAvailableRecoveryMethods = (mfas?: MFA[]): RecoveryMethod[] => {
  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )

  const canAddAuthenticator = useMemo(() => {
    return (mfas ?? []).some(mfa => mfa.type === 'totp') === false
  }, [mfas])

  return useMemo(() => {
    return RECOVERY_METHODS.filter(
      ({ type }) =>
        (type === RecoveryMethods.Passkey &&
          !isSeedlessMfaPasskeyBlocked &&
          PasskeyService.isSupported) ||
        (type === RecoveryMethods.Authenticator &&
          !isSeedlessMfaAuthenticatorBlocked &&
          canAddAuthenticator) ||
        (type === RecoveryMethods.Yubikey &&
          !isSeedlessMfaYubikeyBlocked &&
          PasskeyService.isSupported)
    )
  }, [
    isSeedlessMfaPasskeyBlocked,
    isSeedlessMfaAuthenticatorBlocked,
    isSeedlessMfaYubikeyBlocked,
    canAddAuthenticator
  ])
}
