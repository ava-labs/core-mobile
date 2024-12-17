import { Icons } from '@avalabs/k2-alpine'
import { RecoveryMethod } from './types'

export const RECOVERY_METHODS = [
  {
    type: RecoveryMethod.Passkey,
    title: 'Passkey',
    description: 'Add a Passkey as a recovery method.',
    icon: Icons.RecoveryMethod.Passkey
  },
  {
    type: RecoveryMethod.Authenticator,

    title: 'Authenticator app',
    description: 'Add an Authenticator app as a recovery method.',
    icon: Icons.RecoveryMethod.Authenticator
  },
  {
    type: RecoveryMethod.Yubikey,
    title: 'Yubikey',
    description: 'Add a YubiKey as a recovery method.',
    icon: Icons.RecoveryMethod.Yubikey
  }
]
