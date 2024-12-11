import React from 'react'
import { View } from '../Primitives'
import { useTheme } from '../..'
import { Icons } from '../../theme/tokens/Icons'
import { RecoveryMethodList } from './RecoveryMethodList'
import { RecoveryMethod } from './types'

export default {
  title: 'Recovery Method List'
}

export const All = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const DATA = [
    {
      type: RecoveryMethod.Passkey,
      title: 'Passkey',
      description:
        'Quisque fermentum posuere porta. Phasellus quis efficitur velit.',
      icon: Icons.RecoveryMethod.Passkey
    },
    {
      type: RecoveryMethod.Authenticator,

      title: 'Authenticator app',
      description:
        'Aenean condimentum mi vehicula, consectetur ex eu, pharetra lectus.',
      icon: Icons.RecoveryMethod.Authenticator
    },
    {
      type: RecoveryMethod.Yubikey,
      title: 'Yubikey',
      description:
        'Vestibulum ultricies mattis odio, a pulvinar nulla tristique quis rutrum arcu lorem.',
      icon: Icons.RecoveryMethod.Yubikey
    }
  ]

  const handleOnPress = (type: RecoveryMethod): void => {
    // eslint-disable-next-line no-console
    console.log('Selected recovery method:', type)
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.$surfacePrimary,
        padding: 16
      }}>
      <RecoveryMethodList data={DATA} onPress={handleOnPress} />
    </View>
  )
}
