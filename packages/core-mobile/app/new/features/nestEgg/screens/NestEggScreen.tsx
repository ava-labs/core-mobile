import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setHasSeenCampaign } from 'store/nestEgg'
import { NEST_EGG_CAMPAIGN_URL } from 'store/nestEgg/types'
import { TermsAndConditionsCaption } from '../components/TermsAndConditionsCaption'

function NestEggScreen(): JSX.Element {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const { openUrl } = useCoreBrowser()

  const handleDismiss = useCallback(() => {
    router.canDismiss() && router.dismissAll()
  }, [router])

  const handleLearnMore = useCallback(() => {
    AnalyticsService.capture('NestEggCampaignLearnMoreClicked')
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

  useEffect(() => {
    AnalyticsService.capture('NestEggCampaignModalViewed')
    return () => {
      dispatch(setHasSeenCampaign(true))
    }
  }, [dispatch])

  const containerStyle = {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.$borderPrimary,
    height: 48,
    justifyContent: 'center'
  }

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
        {/* TODO: add lottie animation */}
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
            maxWidth: 300
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
