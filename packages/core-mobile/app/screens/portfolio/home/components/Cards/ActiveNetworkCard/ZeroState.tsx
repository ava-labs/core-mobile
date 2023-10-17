import React from 'react'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import TagSVG from 'components/svg/TagSVG'
import QRSVG from 'components/svg/QRSVG'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import useInAppBrowser from 'hooks/useInAppBrowser'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const ZeroState = () => {
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const { openMoonPay } = useInAppBrowser()
  const { navigate } = useNavigation<NavigationProp>()

  const navigateToReceiveTokens = () => {
    navigate(AppNavigation.Wallet.ReceiveTokens)
  }

  let buttons

  if (!buyDisabled) {
    buttons = (
      <>
        <AvaButton.SecondaryMedium
          icon={<TagSVG />}
          onPress={openMoonPay}
          style={{
            flex: 0.5
          }}>
          Buy
        </AvaButton.SecondaryMedium>
        <Space x={11} />
        <AvaButton.SecondaryMedium
          icon={<QRSVG />}
          onPress={navigateToReceiveTokens}
          style={{ flex: 0.5 }}>
          Receive
        </AvaButton.SecondaryMedium>
      </>
    )
  } else {
    buttons = (
      <AvaButton.SecondaryMedium
        icon={<QRSVG />}
        onPress={navigateToReceiveTokens}
        style={{ flex: 1 }}>
        Receive
      </AvaButton.SecondaryMedium>
    )
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 8
      }}>
      {buttons}
    </View>
  )
}

export default ZeroState
