import React from 'react'
import { Space } from 'common/components/Space'
import {
  Text,
  useTheme,
  View,
  Toggle,
  Tooltip,
  alpha
} from '@avalabs/k2-alpine'
import { Eip1559Fees } from 'utils/Utils'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { NetworkFeeSelector } from './NetworkFeeSelector/NetworkFeeSelector'

type Props = {
  gaslessEnabled: boolean
  setGaslessEnabled: React.Dispatch<React.SetStateAction<boolean>>
  shouldShowGaslessSwitch: boolean
  gasLimit: number | undefined
  handleFeesChange: (fees: Eip1559Fees) => void
  caip2ChainId: string
}

export const NetworkFeeSelectorWithGasless = ({
  gaslessEnabled,
  setGaslessEnabled,
  shouldShowGaslessSwitch,
  gasLimit,
  caip2ChainId,
  handleFeesChange
}: Props): JSX.Element => {
  const { theme } = useTheme()
  const chainId = getChainIdFromCaip2(caip2ChainId)

  const renderGaslessSwitch = (): JSX.Element | null => {
    if (!shouldShowGaslessSwitch) {
      return null
    }
    return (
      <View
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexDirection: 'row',
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          padding: 16
        }}>
        <View
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row'
          }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                variant="body1"
                sx={{ fontSize: 16, lineHeight: 22, color: '$textPrimary' }}>
                Get free gas{' '}
              </Text>
              <Tooltip
                title="Get free gas"
                description="When toggled Core will pay the network fee for this transaction."
              />
            </View>
            <Text
              variant="body1"
              sx={{
                fontSize: 13,
                lineHeight: 16,
                color: alpha(theme.colors.$textSecondary, 0.6)
              }}>
              Gas fees paid by Core
            </Text>
          </View>

          <Space x={4} />
        </View>
        <Toggle
          value={gaslessEnabled}
          onValueChange={() => setGaslessEnabled(prevState => !prevState)}
        />
      </View>
    )
  }

  const renderNetworkFeeSelector = (): JSX.Element | null => {
    if (gaslessEnabled && shouldShowGaslessSwitch) return null
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
    <View>
      <View>{renderGaslessSwitch()}</View>
      {renderNetworkFeeSelector()}
    </View>
  )
}
