import { Button, Text, useTheme, View, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter, useFocusEffect } from 'expo-router'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { setHasAcknowledgedQualification } from 'store/nestEgg'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { TermsAndConditionsCaption } from '../components/TermsAndConditionsCaption'

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
          marginTop: 50
        }}>
        <Icons.Custom.Airdrop
          width={80}
          height={80}
          color={theme.colors.$textPrimary}
        />

        <View
          style={{
            gap: 12,
            marginTop: 24,
            alignItems: 'center',
            maxWidth: 320
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
