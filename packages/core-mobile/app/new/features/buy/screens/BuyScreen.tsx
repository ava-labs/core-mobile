import { noop } from '@avalabs/core-utils-sdk'
import {
  GroupList,
  Icons,
  Logos,
  showAlert,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Warning } from 'new/common/components/Warning'
import React, { FC, useCallback, useMemo } from 'react'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import {
  selectIsCoinbasePayBlocked,
  selectIsHallidayBridgeBannerBlocked
} from 'store/posthog/slice'
import { openInSystemBrowser } from 'utils/openInSystemBrowser'

enum Provider {
  MOONPAY = 'Moonpay',
  COINBASE = 'Coinbase',
  HALLIDAY = 'Halliday'
}

const LOGO_SIZE = 36

export const BuyScreen: FC = () => {
  const { back } = useRouter()
  const { openUrl } = useCoreBrowser()
  const { theme } = useTheme()
  const { showAvaxWarning } = useLocalSearchParams()
  const isCoinbasePayBlocked = useSelector(selectIsCoinbasePayBlocked)
  const isHallidayBannerBlocked = useSelector(
    selectIsHallidayBridgeBannerBlocked
  )
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const openMoonpay = useCallback(async (): Promise<void> => {
    if (!address) return

    AnalyticsService.capture('MoonpayBuyClicked')

    const request = await fetch(`${Config.PROXY_URL}/moonpay/${address}`)
    const result = await request.json()

    back()
    openUrl({
      url: result.url,
      title: 'Moonpay'
    })
  }, [address, back, openUrl])

  const openCoinbase = useCallback((): void => {
    if (!address) return

    AnalyticsService.capture('CoinbasePayBuyClicked')

    const url = generateOnRampURL({
      appId: Config.COINBASE_APP_ID,
      addresses: { [address]: ['avacchain'] },
      assets: ['AVAX'],
      defaultExperience: 'buy'
    })

    // opening in system browser since we couldn't get
    // coinbase to work with the in app browser fully
    back()
    openInSystemBrowser(url)
  }, [address, back])

  const openHalliday = useCallback((): void => {
    AnalyticsService.capture('HallidayBuyClicked')

    const url = 'https://core.app/bridge/?useHalliday=1&useEmbed=1'

    back()
    openUrl({
      url,
      title: 'Halliday'
    })
  }, [back, openUrl])

  const onPaySelection = useCallback(
    (provider: Provider): void => {
      showAlert({
        title: `Do you want to proceed to ${provider}?`,
        description: `Tapping “Continue” will take you to a page powered by our partner ${provider}. Use is subject to ${provider}'s terms and policies.`,
        buttons: [
          {
            text: 'Cancel',
            onPress: () => noop()
          },
          {
            text: 'Continue',
            onPress: () => {
              switch (provider) {
                case Provider.MOONPAY:
                  openMoonpay()
                  break
                case Provider.COINBASE:
                  openCoinbase()
                  break
                case Provider.HALLIDAY:
                  openHalliday()
                  break
              }
            }
          }
        ]
      })
    },
    [openCoinbase, openHalliday, openMoonpay]
  )

  const renderAvaxWarning = (): React.JSX.Element | undefined => {
    if (showAvaxWarning === 'true')
      return (
        <Warning message="Make sure to buy AVAX native token for transactions" />
      )
  }

  const data = useMemo(() => {
    const providers = []

    if (!isCoinbasePayBlocked) {
      providers.push({
        title: 'Coinbase Pay',
        subtitle: 'Continue using Coinbase Pay',
        onPress: () => onPaySelection(Provider.COINBASE),
        rightIcon: <Icons.Custom.Outbound color={theme.colors.$textPrimary} />,
        leftIcon: (
          <View
            style={{
              borderRadius: 100,
              overflow: 'hidden'
            }}>
            <Logos.PartnerLogos.CoinbasePay
              accessibilityRole="image"
              testID="coinbasePay_logo"
              width={LOGO_SIZE}
              height={LOGO_SIZE}
            />
          </View>
        )
      })
    }

    providers.push({
      title: 'Moonpay',
      subtitle: 'Continue using Moonpay',
      onPress: () => onPaySelection(Provider.MOONPAY),
      rightIcon: <Icons.Custom.Outbound color={theme.colors.$textPrimary} />,
      leftIcon: (
        <View
          style={{
            borderRadius: 100,
            overflow: 'hidden'
          }}>
          <Logos.PartnerLogos.Moonpay
            accessibilityRole="image"
            testID="moonPay_logo"
            width={LOGO_SIZE}
            height={LOGO_SIZE}
          />
        </View>
      )
    })

    if (!isHallidayBannerBlocked) {
      providers.push({
        title: 'Halliday',
        subtitle: 'Continue using Halliday',
        onPress: () => onPaySelection(Provider.HALLIDAY),
        rightIcon: <Icons.Custom.Outbound color={theme.colors.$textPrimary} />,
        leftIcon: (
          <View
            style={{
              borderRadius: 100,
              overflow: 'hidden'
            }}>
            <Logos.PartnerLogos.Halliday
              testID="halliday_logo"
              accessibilityRole="image"
              width={LOGO_SIZE}
              height={LOGO_SIZE}
            />
          </View>
        )
      })
    }
    return providers
  }, [
    isCoinbasePayBlocked,
    isHallidayBannerBlocked,
    onPaySelection,
    theme.colors.$textPrimary
  ])

  return (
    <ScrollScreen
      title="Buy crypto"
      subtitle="Buy tokens with fiat currency using your debit card or bank account leveraging one of our many partners"
      isModal
      contentContainerStyle={{
        padding: 16
      }}>
      <View
        style={{
          gap: 24,
          paddingTop: 16
        }}>
        {renderAvaxWarning()}
        <GroupList data={data} subtitleVariant="body1" />
      </View>
    </ScrollScreen>
  )
}
