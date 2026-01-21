import { Button, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import React from 'react'
import { View } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useNavigation } from '@react-navigation/native'

export default function CompleteScreen(): JSX.Element {
  const navigation = useNavigation()
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { resetSetup } = useLedgerSetupContext()

  const handleComplete = (): void => {
    resetSetup()
    // dismiss ledger app connection modals
    // complete -> appConnection -> deviceConnection -> pathSelection -> importWallet -> wallets
    router.dismissAll()
    router.canGoBack() && router.back()

    const state = navigation.getParent()?.getState()
    if (state?.routes.some(route => route.name === 'importWallet')) {
      router.canGoBack() && router.back()
    }
  }

  const renderFooter = (): JSX.Element => {
    return (
      <Button type="primary" size="large" onPress={handleComplete}>
        Done
      </Button>
    )
  }

  return (
    <ScrollScreen
      hasParent={true}
      isModal={true}
      renderFooter={renderFooter}
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24
        }}>
        <Icons.Action.CheckCircleOutline
          color={colors.$textSuccess}
          width={75}
          height={75}
        />
        <Text
          variant="heading3"
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 18,
            fontWeight: '600'
          }}>
          Ledger wallet{'\n'}successfully added
        </Text>
        <Text
          variant="body1"
          style={{
            textAlign: 'center',
            color: colors.$textPrimary,
            lineHeight: 20,
            marginBottom: 80
          }}>
          You can now start buying, swapping, sending, receiving crypto and
          collectibles via the app with your Ledger wallet
        </Text>
      </View>
    </ScrollScreen>
  )
}
