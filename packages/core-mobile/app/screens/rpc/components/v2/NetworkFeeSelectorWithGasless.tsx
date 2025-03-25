import React from 'react'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { Text } from '@avalabs/k2-mobile'
import { Eip1559Fees } from 'utils/Utils'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import Switch from 'components/Switch'
import { Tooltip } from 'components/Tooltip'
import InfoSVG from 'components/svg/InfoSVG'

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
          paddingVertical: 8
        }}>
        <Row style={{ alignItems: 'center' }}>
          <Text variant="body2">Get Free Gas</Text>
          <Space x={4} />
          <Tooltip
            content="When toggled Core will pay the network fee for this transaction."
            position="right"
            style={{ width: 200 }}
            icon={<InfoSVG size={14} />}
          />
        </Row>
        <Switch
          value={gaslessEnabled}
          onValueChange={() => setGaslessEnabled(prevState => !prevState)}
        />
      </Row>
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
    <>
      {renderGaslessSwitch()}
      {renderNetworkFeeSelector()}
    </>
  )
}

export default NetworkFeeSelectorWithGasless
