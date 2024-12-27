import React from 'react'
import {
  Icons,
  ScrollView,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import { useRouter } from 'expo-router'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()

  const handleEnterRecoveryPhrase = (): void => {
    // navigate(AppNavigation.Onboard.Welcome, {
    //   screen: AppNavigation.Onboard.AnalyticsConsent,
    //   params: {
    //     nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
    //   }
    // })
  }

  const handleCreateMnemonicWallet = (): void => {
    navigate('./mnemonicOnboarding/termsAndConditions')
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
          <ActionButton
            text="Type in a recovery phrase"
            icon={<Encrypted color={theme.colors.$textPrimary} />}
            onPress={handleEnterRecoveryPhrase}
          />
          <ActionButton
            text="Create a new wallet"
            icon={
              <Icons.Content.Add
                color={theme.colors.$textPrimary}
                style={{ marginLeft: -2 }}
              />
            }
            onPress={handleCreateMnemonicWallet}
          />
        </View>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

const ActionButton = ({
  text,
  icon,
  onPress
}: {
  text: string
  icon: JSX.Element
  onPress: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity sx={{ flex: 1 }} onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          gap: 8,
          paddingHorizontal: 22,
          paddingVertical: 20,
          borderRadius: 18,
          aspectRatio: 1
        }}>
        {icon}
        <Text variant="buttonLarge">{text}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default AccessWalletScreen
