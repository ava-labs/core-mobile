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
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useDebouncedRouter()

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
    <BlurredBarsContentLayout>
      <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
        <Text
          variant="heading2"
          sx={{ marginRight: 10, marginTop: 9, marginBottom: 34 }}>
          How would you like to access your existing wallet?
        </Text>
        <View sx={{ gap: 16, flexDirection: 'row' }}>
          <GroupList
            data={[
              {
                title: 'Type in a recovery phrase',
                leftIcon: <Encrypted color={theme.colors.$textPrimary} />,
                onPress: handleEnterRecoveryPhrase
              },
              {
                title: 'Create a new wallet',
                leftIcon: (
                  <Icons.Content.Add color={theme.colors.$textPrimary} />
                ),
                onPress: handleCreateMnemonicWallet
              }
            ]}
            itemHeight={60}
          />
        </View>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default AccessWalletScreen
