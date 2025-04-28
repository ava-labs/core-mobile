import React from 'react'
import {
  GroupList,
  Icons,
  ScrollView,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useRouter } from 'expo-router'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const handleEnterRecoveryPhrase = (): void => {
    navigate({
      pathname: '/onboarding/mnemonic/',
      params: { recovering: 'true' }
    })
  }

  const handleCreateMnemonicWallet = (): void => {
    navigate({
      pathname: '/onboarding/mnemonic/'
    })
  }

  return (
    <ScrollViewScreenTemplate
      title="How would you like to access your existing wallet?"
      contentContainerStyle={{ padding: 16 }}>
      <GroupList
        data={[
          {
            title: 'Type in a recovery phrase',
            leftIcon: <Encrypted color={theme.colors.$textPrimary} />,
            onPress: handleEnterRecoveryPhrase
          },
          {
            title: 'Create a new wallet',
            leftIcon: <Icons.Content.Add color={theme.colors.$textPrimary} />,
            onPress: handleCreateMnemonicWallet
          }
        ]}
        itemHeight={60}
      />
    </ScrollViewScreenTemplate>
  )
}

export default AccessWalletScreen
