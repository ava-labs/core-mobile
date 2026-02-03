import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { useRouter } from 'expo-router'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { setHasSeenCampaign } from 'store/nestEgg'
import { NEST_EGG_CAMPAIGN_URL } from 'store/nestEgg/types'
import { TermsAndConditionsCaption } from '../components/TermsAndConditionsCaption'

const NEST_EGG_DARK = require('assets/lotties/icon-hero-nest-egg-dark.json')
const NEST_EGG = require('assets/lotties/icon-hero-nest-egg.json')

function NestEggScreen(): JSX.Element {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const { openUrl } = useCoreBrowser()
  const lottieRef = useRef<LottieView>(null)

  const handleDismiss = useCallback(() => {
    router.canDismiss() && router.dismissAll()
  }, [router])

  const handleLearnMore = useCallback(() => {
    handleDismiss()
    openUrl({ url: NEST_EGG_CAMPAIGN_URL, title: 'Nest Egg Campaign' })
  }, [handleDismiss, openUrl])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 12 }}>
        <Button type="primary" size="large" onPress={handleLearnMore}>
          Learn more
        </Button>
        <Button type="secondary" size="large" onPress={handleDismiss}>
          Got it
        </Button>
      </View>
    )
  }, [handleDismiss, handleLearnMore])

  const containerStyle = {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.$borderPrimary,
    paddingVertical: 13,
    justifyContent: 'center'
  }

  const currentAccount = useSelector(selectActiveAccount)

  useEffect(() => {
    AnalyticsService.captureWithEncryption('NestEggCampaignModalViewed', {
      addressC: currentAccount?.addressC ?? ''
    })
    return () => {
      dispatch(setHasSeenCampaign(true))
    }
  }, [currentAccount?.addressC, dispatch])

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        lottieRef.current?.play()
      }, 250)
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
          source={theme.isDark ? NEST_EGG_DARK : NEST_EGG}
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
            maxWidth: 300,
            marginTop: 12
          }}>
          <Text
            variant="heading3"
            sx={{
              textAlign: 'center'
            }}>
            {`Use Core.\nGet a crypto bonus.`}
          </Text>
          <Text variant="subtitle1" sx={{ textAlign: 'center' }}>
            {`Get started today and earn free tokens from top Avalanche ecosystem projects`}
          </Text>
        </View>
      </View>

      <View sx={{ gap: 20 }}>
        <View
          sx={{
            backgroundColor: theme.colors.$surfaceSecondary,
            borderRadius: 12,
            paddingHorizontal: 16
          }}>
          <View sx={containerStyle}>
            <Text variant="subtitle1" sx={{ fontSize: 16 }}>
              1. Fund your wallet with{' '}
              <Text variant="buttonMedium" sx={{ fontSize: 16 }}>
                buy
              </Text>
              {' or '}
              <Text variant="buttonMedium" sx={{ fontSize: 16 }}>
                receive
              </Text>
            </Text>
          </View>
          <View sx={containerStyle}>
            <Text variant="subtitle1" sx={{ fontSize: 16 }}>
              2. Complete a $10 minimum{' '}
              <Text variant="buttonMedium" sx={{ fontSize: 16 }}>
                swap
              </Text>{' '}
              to qualify
            </Text>
          </View>
          <View sx={{ ...containerStyle, borderBottomWidth: 0 }}>
            <Text variant="subtitle1" sx={{ fontSize: 16 }}>
              3. Earn your ecosystem token bonus!
            </Text>
          </View>
        </View>
        <TermsAndConditionsCaption />
      </View>
    </ScrollScreen>
  )
}

export default withNavigationEvents(NestEggScreen)
