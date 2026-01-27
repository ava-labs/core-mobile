import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { useFocusEffect, useRouter } from 'expo-router'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setHasAcknowledgedQualification } from 'store/nestEgg'
import { TermsAndConditionsCaption } from '../components/TermsAndConditionsCaption'

const NEST_EGG_SUCCESS = require('assets/lotties/icon-hero-swap.json')
const NEST_EGG_SUCCESS_DARK = require('assets/lotties/icon-hero-swap-dark.json')

function NestEggSuccessScreen(): JSX.Element {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()

  const handleGotIt = useCallback(() => {
    dispatch(setHasAcknowledgedQualification(true))
    AnalyticsService.capture('NestEggQualificationAcknowledged')
    router.canDismiss() && router.dismissAll()
  }, [dispatch, router])

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handleGotIt}>
        Got it
      </Button>
    )
  }, [handleGotIt])

  // Trigger confetti animation when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      AnalyticsService.capture('NestEggSuccessModalViewed')
    }, [])
  )

  const lottieRef = useRef<LottieView>(null)

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      lottieRef.current?.play()
    })
  }, [])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      contentContainerStyle={{
        padding: 16,
        flex: 1,
        justifyContent: 'space-between',
        gap: 32
      }}>
      <View
        style={{
          alignItems: 'center',
          marginTop: 24
        }}>
        <LottieView
          source={theme.isDark ? NEST_EGG_SUCCESS_DARK : NEST_EGG_SUCCESS}
          ref={lottieRef}
          autoPlay
          loop={false}
          style={{
            width: 120 * 1.3,
            height: 96 * 1.3
          }}
        />

        <View
          style={{
            gap: 12,
            alignItems: 'center',
            maxWidth: 300
          }}>
          <Text
            variant="heading3"
            sx={{
              textAlign: 'center'
            }}>
            {`Congratulations!\nSwap complete.`}
          </Text>
          <Text variant="subtitle1" sx={{ textAlign: 'center' }}>
            {`If you qualified you will receive your ecosystem token bonus in your wallet within a few days`}
          </Text>
        </View>
      </View>
      <TermsAndConditionsCaption />
    </ScrollScreen>
  )
}

export default withNavigationEvents(NestEggSuccessScreen)
