import React from 'react'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { Text, useTheme, View } from '@avalabs/k2-mobile'
import { Eip1559Fees } from 'utils/Utils'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import Switch from 'components/Switch'
import { Tooltip } from 'components/Tooltip'
import InfoSVG from 'components/svg/InfoSVG'
import Separator from 'components/Separator'

type Props = {
  gaslessEnabled: boolean
  setGaslessEnabled: React.Dispatch<React.SetStateAction<boolean>>
  showGaslessSwitch: boolean
  gasLimit: number | undefined
  handleFeesChange: (fees: Eip1559Fees) => void
  caip2ChainId: string
}

const NetworkFeeSelectorWithGasless = ({
  gaslessEnabled,
  setGaslessEnabled,
  showGaslessSwitch,
  gasLimit,
  caip2ChainId,
  handleFeesChange
}: Props): JSX.Element => {
  const { theme } = useTheme()
  const chainId = getChainIdFromCaip2(caip2ChainId)

  const renderGaslessSwitch = (): JSX.Element | null => {
    if (!showGaslessSwitch) {
      return null
    }
    return (
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 8,
          marginBottom: 24
        }}>
        <Row style={{ alignItems: 'center' }}>
          <Text variant="body2">Get Free Gas</Text>
          <Space x={4} />
          <Tooltip
            content="When toggled Core will pay the network fee for this transaction."
            position="right"
            style={{ width: 200 }}
            icon={<InfoSVG size={14} color="white" />}
          />
        </Row>
        <Switch
          value={gaslessEnabled}
          onValueChange={() => setGaslessEnabled(prevState => !prevState)}
        />
      </Row>
    )
  }

  const renderSeparator = (): JSX.Element | null => {
    if (!showGaslessSwitch || gaslessEnabled) return null

    return (
      <Separator
        style={{ marginBottom: 10 }}
        color={theme.colors.$neutral600}
      />
    )
  }
  const renderNetworkFeeSelector = (): JSX.Element | null => {
    if (gaslessEnabled && showGaslessSwitch) return null
    if (!chainId || !gasLimit) return null

    return (
      <NetworkFeeSelector
        chainId={chainId}
        gasLimit={gasLimit}
        onFeesChange={handleFeesChange}
      />
    )
  }

  return (
    <View
      sx={{
        backgroundColor: '$neutral800',
        borderRadius: 8
      }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16
        }}>
        {renderGaslessSwitch()}
        {renderSeparator()}
      </View>
      {renderNetworkFeeSelector()}
    </View>
  )
}

export default NetworkFeeSelectorWithGasless
