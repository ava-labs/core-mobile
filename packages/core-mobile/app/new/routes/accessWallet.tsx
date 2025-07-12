import { GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import Keystone from 'assets/icons/keystone.svg'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React from 'react'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const handleEnterRecoveryPhrase = (): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/',
      params: { recovering: 'true' }
    })
  }

  const handleEnterKeystone = (): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/keystone/termsAndConditions/'
    })
  }

  const handleCreateMnemonicWallet = (): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/'
    })
  }

  return (
    <ScrollScreen
      title="How would you like to access your existing wallet?"
      contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <GroupList
          data={[
            {
              title: 'Type in a recovery phrase',
              leftIcon: <Encrypted color={theme.colors.$textPrimary} />,
              onPress: handleEnterRecoveryPhrase
            },
            {
              title: 'Add using Keystone',
              leftIcon: <Keystone color={theme.colors.$textPrimary} />,
              onPress: handleEnterKeystone
            },
            {
              title: 'Create a new wallet',
              leftIcon: <Icons.Content.Add color={theme.colors.$textPrimary} />,
              onPress: handleCreateMnemonicWallet
            }
          ]}
          itemHeight={60}
        />
      </View>
    </ScrollScreen>
  )
}

export default AccessWalletScreen
