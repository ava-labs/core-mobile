import {
  Button,
  GroupList,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setHasSeenCampaign } from 'store/nestEgg'
import { NEST_EGG_CAMPAIGN_URL } from 'store/nestEgg/types'

function NestEggCampaignScreen(): JSX.Element {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const { openUrl } = useCoreBrowser()

  const handleDismiss = useCallback(() => {
    router.canDismiss() && router.dismissAll()
  }, [router])

  const handleLearnMore = useCallback(() => {
    AnalyticsService.capture('NestEggCampaignLearnMoreClicked')
    openUrl({ url: NEST_EGG_CAMPAIGN_URL, title: 'Nest Egg Campaign' })
  }, [openUrl])

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
            {`Use Core.\nGet a crypto bonus.`}
          </Text>
          <Text variant="subtitle1" sx={{ textAlign: 'center' }}>
            {`Get started today and earn free tokens from top Avalanche ecosystem projects`}
          </Text>
        </View>
      </View>
      <View sx={{ gap: 20 }}>
        <GroupList
          data={[
            {
              title: '1. Fund your wallet with buy or receive'
            },
            {
              title: '2. Complete a swap to qualify'
            },
            {
              title: '3. Earn your ecosystem token bonus!'
            }
          ]}
        />
        <Text
          variant="caption"
          sx={{
            color: theme.colors.$textSecondary,
            fontFamily: 'Inter-Medium',
            paddingRight: 48
          }}>
          *Swapping does not guarantee qualification. Tokens are distributed at
          2pm ET weekly on Mondays. Subject to availability and the Core terms
          and conditions.
        </Text>
      </View>
    </ScrollScreen>
  )
}

export default withNavigationEvents(NestEggCampaignScreen)
