import React from 'react'
import { View } from '../Primitives'
import { useTheme } from '../..'
import { Icons } from '../../theme/tokens/Icons'
import { RecoveryMethodList } from './RecoveryMethodList'

export default {
  title: 'Recovery Method List'
}

export const All = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const DATA = [
    {
      title: 'Passkey',
      description:
        'Quisque fermentum posuere porta. Phasellus quis efficitur velit.',
      icon: Icons.RecoveryMethod.Passkey
    },
    {
      title: 'Authenticator app',
      description:
        'Aenean condimentum mi vehicula, consectetur ex eu, pharetra lectus.',
      icon: Icons.RecoveryMethod.Authenticator
    },
    {
      title: 'Yubikey',
      description:
        'Vestibulum ultricies mattis odio, a pulvinar nulla tristique quis rutrum arcu lorem.',
      icon: Icons.RecoveryMethod.Yubikey
    }
  ]

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.$surfacePrimary,
        padding: 16
      }}>
      <RecoveryMethodList data={DATA} />
    </View>
  )
}
