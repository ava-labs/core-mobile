import React from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Image, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Logger from 'utils/Logger'
import BuyPrompt from './BuyPrompt'

const MoonPayLogo = require('assets/icons/moonpay-icon.png')
const CoinbaseLogo = require('assets/icons/coinbase.png')

type BuyCarefullyScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BuyCarefully
>

export enum Provider {
  COINBASE = 'coinbase',
  MOONPAY = 'moonpay'
}

const BuyCarefully = (): JSX.Element => {
  const activeAccount = useSelector(selectActiveAccount)
  const { goBack } = useNavigation<BuyCarefullyScreenProps['navigation']>()

  const { provider } = useRoute<BuyCarefullyScreenProps['route']>().params

  const isCoinbasePay = provider === Provider.COINBASE
  const { openMoonPay, openCoinBasePay } = useInAppBrowser()

  const onCoinBasePay = (): void => {
    if (activeAccount?.addressC) {
      openCoinBasePay(activeAccount?.addressC).catch(Logger.error)
    }
  }

  return (
    <BuyPrompt
      onConfirm={isCoinbasePay ? onCoinBasePay : openMoonPay}
      onCancel={() => goBack()}
      renderIcon={() => (
        <Image
          accessibilityRole="image"
          source={isCoinbasePay ? CoinbaseLogo : MoonPayLogo}
        />
      )}
      renderContent={() => (
        <View
          style={{
            width: 287
          }}>
          <AvaText.Heading2 textStyle={{ textAlign: 'center', fontSize: 20 }}>
            {`Proceed to ${isCoinbasePay ? 'Coinbase Pay' : 'Moonpay'}?`}
          </AvaText.Heading2>
          <Space y={8} />
          <AvaText.Body1 textStyle={{ textAlign: 'center' }}>
            {`Use is subject to ${
              isCoinbasePay ? "Coinbase Pay's" : "Moonpay's"
            } terms and policies.`}
          </AvaText.Body1>
        </View>
      )}
      header="Read Carefully"
      description={`Clicking “Continue” will take you to a page powered by our partner ${
        isCoinbasePay ? 'Coinbase Pay' : 'Moonpay'
      }.`}
    />
  )
}

export default BuyCarefully
