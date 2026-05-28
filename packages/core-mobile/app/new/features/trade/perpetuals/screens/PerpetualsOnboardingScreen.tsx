import {
  alpha,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useNavigation, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

import HyperliquidLogo from '../../../../assets/icons/hyperliquid-logo.svg'

export const PerpetualsOnboardingScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const navigation = useNavigation()
  const dismissedViaCtaRef = useRef(false)

  useEffect(() => {
    AnalyticsService.capture('PerpetualsOnboardingViewed')
  }, [])

  // Fire the "viewed once" flag + dismissed analytics only when the screen is
  // actually being removed from the navigation stack — covers both the CTA
  // tap (router.back) and the swipe-down gesture, but skips component
  // unmounts caused by other lifecycle events (nav reset, app backgrounding).
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      dispatch(setViewOnce(ViewOnceKey.PERPETUALS_ONBOARDING))
      AnalyticsService.capture('PerpetualsOnboardingDismissed', {
        via: dismissedViaCtaRef.current ? 'cta' : 'gesture'
      })
    })
  }, [navigation, dispatch])

  const handlePressNext = useCallback(() => {
    dismissedViaCtaRef.current = true
    if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  const features = useMemo(
    (): GroupListItem[] => [
      {
        title: 'Trade crypto, stocks, and commodities',
        value: <Icons.Navigation.Check color={theme.colors.$textSuccess} />
      },
      {
        title: 'Access to up to 50x leverage',
        value: <Icons.Navigation.Check color={theme.colors.$textSuccess} />
      },
      {
        title: 'Open long or short positions',
        value: <Icons.Navigation.Check color={theme.colors.$textSuccess} />
      }
    ],
    [theme.colors.$textSuccess]
  )

  const renderFooter = useCallback(
    () => (
      <Button type="primary" size="large" onPress={handlePressNext}>
        Let's go!
      </Button>
    ),
    [handlePressNext]
  )

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16,
        flex: 1,
        justifyContent: 'space-between'
      }}>
      <View
        sx={{
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 32
        }}>
        <Icons.Custom.Candlesticks
          width={60}
          height={60}
          color={theme.colors.$textPrimary}
        />
        <View sx={{ alignItems: 'center', gap: 10 }}>
          <View
            sx={{
              marginTop: 24,
              backgroundColor: '#f7b500',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 6
            }}>
            <Text
              variant="caption"
              sx={{
                fontFamily: 'Inter-Bold',
                fontSize: 12,
                color: theme.colors.$textPrimary
              }}>
              NEW
            </Text>
          </View>

          <Text
            variant="heading3"
            sx={{
              textAlign: 'center',
              lineHeight: 30
            }}>
            Bet on price movements
          </Text>

          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
            <Text variant="subtitle1">
              {'Speculate on future prices by going '}
            </Text>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <StatusArrow status={PriceChangeStatus.Down} size={10} />
              <Text
                variant="subtitle1"
                sx={{
                  fontFamily: 'Inter-Medium',
                  color: theme.colors.$textDanger
                }}>
                {` short`}
              </Text>
            </View>
            <Text variant="subtitle1">{` or `}</Text>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <StatusArrow status={PriceChangeStatus.Up} size={10} />
              <Text
                variant="subtitle1"
                sx={{
                  fontFamily: 'Inter-Medium',
                  color: theme.colors.$textSuccess
                }}>
                {' long'}
              </Text>
            </View>
            <Text variant="subtitle1">. Earn when you</Text>
            <Text variant="subtitle1">predict correctly.</Text>
          </View>

          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              variant="caption"
              sx={{
                color: '$textSecondary'
              }}>
              Powered by
            </Text>
            <HyperliquidLogo color={alpha(theme.colors.$textPrimary, 0.6)} />
          </View>
        </View>
      </View>

      <GroupList data={features} titleSx={{ fontFamily: 'Inter-Regular' }} />
    </ScrollScreen>
  )
}
