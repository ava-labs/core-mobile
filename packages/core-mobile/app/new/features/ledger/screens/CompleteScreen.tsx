import { Button, Text, useTheme } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import React, { useEffect, useRef } from 'react'
import { InteractionManager, View } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useNavigation } from 'expo-router'
import LottieView from 'lottie-react-native'

const SUCCESS_CHECKMARK = require('assets/lotties/success-checkmark.json')

export default function CompleteScreen(): JSX.Element {
  const navigation = useNavigation()
  const router = useRouter()
  const {
    theme: { colors, isDark }
  } = useTheme()
  const lottieRef = useRef<LottieView>(null)

  const { resetSetup } = useLedgerSetupContext()

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      lottieRef.current?.play()
    })
  }, [])

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
        <LottieView
          ref={lottieRef}
          source={SUCCESS_CHECKMARK}
          colorFilters={[
            { keypath: '**', color: isDark ? '#1CC51D' : '#1FA95E' }
          ]}
          autoPlay
          loop={false}
          style={{ width: 96, height: 96 }}
        />
        <Text
          variant="heading3"
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 18,
            fontFamily: 'Inter-SemiBold'
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
