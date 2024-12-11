import { FC } from 'react'
import { SvgProps } from 'react-native-svg'

export enum RecoveryMethod {
  Passkey = 'passkey',
  Authenticator = 'authenticator',
  Yubikey = 'yubikey'
}

export type RecoveryMethodData = {
  type: RecoveryMethod
  title: string
  description: string
  icon: FC<SvgProps>
}
