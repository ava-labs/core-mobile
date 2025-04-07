import {
  Icons,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { useLayoutEffect } from 'react'
import { Row } from 'components/Row'
import Encrypted from 'assets/icons/encrypted.svg'
import Keystone from 'assets/icons/keystone.svg'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.AccessMnemonicWallet
>['navigation']

const AccessMnemonicWalletScreen = (): JSX.Element => {
  const { navigate, setOptions } = useNavigation<NavigationProp>()
  const { theme } = useTheme()

  useLayoutEffect(() => {
    setOptions({
      headerShown: true,
      title: '',
      headerBackButtonDisplayMode: 'minimal'
    })
  }, [setOptions])

  const handleEnterRecoveryPhrase = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
      }
    })
  }

  const handleCreateMnemonicWallet = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.CreateWalletStack
      }
    })
  }

  const handleRecoverWalletUsingKeystone = (): void => {
    navigate(AppNavigation.Onboard.Welcome, {
      screen: AppNavigation.Onboard.AnalyticsConsent,
      params: {
        nextScreen: AppNavigation.Onboard.RecoverWithKeystone
      }
    })
  }

  return (
    <ScrollView
      sx={{ flex: 1, backgroundColor: '$black' }}
      contentContainerSx={{ paddingHorizontal: 16 }}>
      <Text variant="heading3" sx={{ marginRight: 10 }}>
        How would you like to access your existing wallet?
      </Text>
      <Row style={{ marginTop: 60, gap: 16 }}>
        <ActionButton
          text="Type in a recovery phrase"
          icon={<Encrypted color={theme.colors.$white} />}
          onPress={handleEnterRecoveryPhrase}
        />
        <ActionButton
          text="Create a new wallet"
          icon={
            <Icons.Content.Add
              color={theme.colors.$white}
              style={{ marginLeft: -2 }}
            />
          }
          onPress={handleCreateMnemonicWallet}
        />
      </Row>
      <Row style={{ marginTop: 30, gap: 16 }}>
        <ActionButton
          text="Add using Keystone"
          icon={<Keystone color={theme.colors.$white} />}
          onPress={handleRecoverWalletUsingKeystone}
        />
        <View style={{ flex: 1 }} />
      </Row>
    </ScrollView>
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
          backgroundColor: '$neutral900',
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

export default AccessMnemonicWalletScreen
