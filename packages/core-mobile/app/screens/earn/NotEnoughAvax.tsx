import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import InfoSVG from 'components/svg/InfoSVG'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'

export default function NotEnoughAvax({
  onBuyAvax,
  onSwap,
  onReceive
}: {
  onBuyAvax: () => void
  onSwap: () => void
  onReceive: () => void
}) {
  const { theme } = useApplicationContext()
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const swapDisabled = useIsUIDisabled(UI.Swap)

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <View style={{ alignItems: 'center' }}>
        <Space y={80} />
        <InfoSVG size={56} color={theme.white} />
        <Space y={24} />
        <View style={{ paddingHorizontal: 23, alignItems: 'center' }}>
          <AvaText.Heading5>You don’t have enough AVAX!</AvaText.Heading5>
          <Space y={8} />
          <AvaText.Body2 textStyle={{ textAlign: 'center', lineHeight: 20 }}>
            {'Buy or Swap AVAX to begin staking.'}
          </AvaText.Body2>
        </View>
      </View>
      <Space y={24} />
      {!swapDisabled && (
        <AvaButton.PrimaryLarge onPress={onSwap}>
          Swap AVAX
        </AvaButton.PrimaryLarge>
      )}
      <Space y={16} />
      <Row>
        <AvaButton.SecondaryLarge onPress={onReceive} style={{ flex: 1 }}>
          Receive AVAX
        </AvaButton.SecondaryLarge>
        {!buyDisabled && (
          <>
            <Space y={16} />
            <AvaButton.SecondaryLarge onPress={onBuyAvax} style={{ flex: 1 }}>
              Buy AVAX
            </AvaButton.SecondaryLarge>
          </>
        )}
      </Row>
    </View>
  )
}
