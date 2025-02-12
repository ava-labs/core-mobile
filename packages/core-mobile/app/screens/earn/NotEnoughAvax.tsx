import React from 'react'
import { Row } from 'components/Row'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import useStakingParams from 'hooks/earn/useStakingParams'
import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-mobile'

export default function NotEnoughAvax({
  onBuyAvax,
  onSwap,
  onReceive
}: {
  onBuyAvax: () => void
  onSwap: () => void
  onReceive: () => void
}): React.JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const { minStakeAmount } = useStakingParams()

  return (
    <View sx={{ padding: 16, flex: 1 }}>
      <Text variant="heading3">Stake</Text>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingBottom: 80,
          gap: 24
        }}>
        <Icons.Alert.IconErrorOutline
          color={colors.$white}
          width={72}
          height={72}
          style={{ alignSelf: 'center' }}
        />
        <View sx={{ paddingHorizontal: 23, alignItems: 'center', gap: 8 }}>
          <Text variant="heading5">
            {minStakeAmount.toDisplay()} AVAX required
          </Text>
          <Text
            variant="body2"
            sx={{ textAlign: 'center', color: '$neutral400' }}>
            {`You need at least ${minStakeAmount.toDisplay()} AVAX to stake.\nUse the options below to get started.`}
          </Text>
        </View>
        <View sx={{ gap: 16 }}>
          {!swapDisabled && (
            <Button type="primary" size="xlarge" onPress={onSwap}>
              Swap AVAX
            </Button>
          )}
          <Row style={{ gap: 16 }}>
            <Button
              type="secondary"
              size="xlarge"
              onPress={onReceive}
              style={{ flex: 1 }}>
              Receive AVAX
            </Button>
            {!buyDisabled && (
              <Button
                type="secondary"
                size="xlarge"
                onPress={onBuyAvax}
                style={{ flex: 1 }}>
                Buy AVAX
              </Button>
            )}
          </Row>
        </View>
      </View>
    </View>
  )
}
