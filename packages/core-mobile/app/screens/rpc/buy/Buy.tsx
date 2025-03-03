import React, { FC } from 'react'
import { Image, ScrollView, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { BuyScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Icons, Text, useTheme, View } from '@avalabs/k2-mobile'
import InfoSVG from 'components/svg/InfoSVG'
import {
  selectIsCoinbasePayBlocked,
  selectIsHallidayBridgeBannerBlocked
} from 'store/posthog/slice'
import { useSelector } from 'react-redux'
import { Provider } from './BuyCarefully'

const MoonPayLogo = require('assets/icons/moonpay-icon.png')
const CoinbaseLogo = require('assets/icons/coinbase.png')
const LOGO_SIZE = 64

type ScreenProps = BuyScreenProps<typeof AppNavigation.Buy.Buy>

const Buy: FC = () => {
  const { theme } = useApplicationContext()
  const { theme: k2Theme } = useTheme()
  const navigation = useNavigation<ScreenProps['navigation']>()
  const { params } = useRoute<ScreenProps['route']>()
  const isCoinbasePayBlocked = useSelector(selectIsCoinbasePayBlocked)
  const isHallidayBannerBlocked = useSelector(
    selectIsHallidayBridgeBannerBlocked
  )

  const openHalliday = async (): Promise<void> => {
    AnalyticsService.capture('HallidayBuyClicked')
    navigation.navigate(AppNavigation.Wallet.Halliday)
  }

  const onPaySelection = (provider: Provider): void => {
    AnalyticsService.capture(
      provider === Provider.COINBASE
        ? 'CoinbasePayBuyClicked'
        : 'MoonpayBuyClicked'
    )
    navigation.navigate(AppNavigation.Modal.BuyCarefully, {
      provider
    })
  }

  const renderAvaxWarning = (): React.JSX.Element | undefined => {
    if (params?.showAvaxWarning)
      return (
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <View
            sx={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: '$dangerLight',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
            <InfoSVG color={k2Theme.colors.$black} size={24} />
            <View sx={{ flex: 1 }}>
              <Text
                variant="alertDescription"
                sx={{
                  color: '$black',
                  fontSize: 13,
                  lineHeight: 16,
                  fontWeight: '500'
                }}>
                Make sure to buy AVAX native token for transactions
              </Text>
            </View>
          </View>
        </View>
      )
  }

  const title = params?.showAvaxWarning ? 'Buy AVAX' : 'Buy'

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        {title}
      </AvaText.LargeTitleBold>
      {renderAvaxWarning()}
      <Space y={12} />
      <View style={style.mainContainer}>
        <AvaText.Heading3 textStyle={style.title}>
          Continue with...
        </AvaText.Heading3>
        <View style={style.buttonsContainer}>
          <AvaButton.Base
            onPress={() => onPaySelection(Provider.MOONPAY)}
            style={[style.buttonBase, { backgroundColor: theme.neutral850 }]}>
            <Space y={14} />
            <AvaText.ButtonLarge
              textStyle={[
                style.buttonLabel,
                {
                  color: theme.colorText1
                }
              ]}>
              Moonpay
            </AvaText.ButtonLarge>
            <Image
              accessibilityRole="image"
              source={MoonPayLogo}
              style={style.logo}
              testID="moonPay_logo"
            />
            <Space y={16} />
          </AvaButton.Base>
          {!isCoinbasePayBlocked && (
            <AvaButton.Base
              onPress={() => onPaySelection(Provider.COINBASE)}
              style={[style.buttonBase, { backgroundColor: theme.neutral850 }]}>
              <Space y={14} />
              <AvaText.ButtonLarge
                textStyle={[
                  style.buttonLabel,
                  {
                    color: theme.colorText1
                  }
                ]}>
                Coinbase Pay
              </AvaText.ButtonLarge>
              <Image
                accessibilityRole="image"
                source={CoinbaseLogo}
                style={style.logo}
                testID="coinbasePay_logo"
              />
              <Space y={16} />
            </AvaButton.Base>
          )}
        </View>
        <Space y={20} />
        {!isHallidayBannerBlocked && (
          <AvaButton.Base
            onPress={() => openHalliday()}
            style={[style.buttonBase, { backgroundColor: theme.neutral850 }]}>
            <Space y={14} />
            <AvaText.ButtonLarge
              textStyle={[
                style.buttonLabel,
                {
                  color: theme.colorText1
                }
              ]}>
              Halliday
            </AvaText.ButtonLarge>
            <View
              style={{ borderRadius: 32, overflow: 'hidden' }}
              testID="halliday_logo">
              <Icons.Logos.Halliday
                accessibilityRole="image"
                width={LOGO_SIZE}
                height={LOGO_SIZE}
              />
            </View>
            <Space y={16} />
          </AvaButton.Base>
        )}
      </View>
    </ScrollView>
  )
}

const style = StyleSheet.create({
  mainContainer: {
    flexGrow: 1,
    paddingHorizontal: 16
  },
  title: {
    marginTop: 16,
    marginBottom: 24
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  buttonBase: {
    height: 164,
    width: 165,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8
  },
  buttonLabel: {
    textAlign: 'center',
    marginBottom: 24
  },
  logo: {
    height: LOGO_SIZE,
    width: LOGO_SIZE,
    resizeMode: 'contain'
  }
})

export default Buy
