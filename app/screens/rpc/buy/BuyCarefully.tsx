import React from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Image, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import useInAppBrowser from 'hooks/useInAppBrowser'
import BuyPrompt from './BuyPrompt'

const CoinbaseLogo = require('./coinbase.png')
const MoonPayLogo = require('./moonpay-icon.png')

type BuyCarefullyScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.BuyCarefully
>

export enum TokenType {
  COINBASE = 'coinbase',
  MOONPAY = 'moonpay'
}

const BuyCarefully = () => {
  const { goBack } = useNavigation<BuyCarefullyScreenProps['navigation']>()

  const { tokenType } = useRoute<BuyCarefullyScreenProps['route']>().params

  const isCoinbasePay = tokenType === TokenType.COINBASE
  const { openMoonPay } = useInAppBrowser()

  const openCoinBase = () => {
    // TODO: Will remove and updated this feature in ticket CP-4887
    console.log('open coinbase')
  }

  return (
    <BuyPrompt
      onConfirm={isCoinbasePay ? openCoinBase : openMoonPay}
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
