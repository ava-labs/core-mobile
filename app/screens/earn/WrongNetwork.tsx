import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import SwitchSVG from 'components/svg/SwitchSVG'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { setActive } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useDispatch, useSelector } from 'react-redux'
import { ChainId } from '@avalabs/chains-sdk'

export const WrongNetwork = () => {
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avalancheChainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID

  const onSwitchNetwork = () => {
    dispatch(setActive(avalancheChainId))
  }

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Space y={80} />
        <SwitchSVG />
        <Space y={24} />
        <AvaText.Heading5>Switch Network to Stake</AvaText.Heading5>
        <Space y={8} />
        <AvaText.Body2
          textStyle={{
            textAlign: 'center',
            lineHeight: 20
          }}>
          Staking is only available on the Avalanche Network. Please switch
          networks to continue.
        </AvaText.Body2>
        <Space y={24} />
        <AvaButton.PrimaryLarge
          onPress={onSwitchNetwork}
          style={{ width: '100%' }}>
          Switch to Avalanche Network
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}
