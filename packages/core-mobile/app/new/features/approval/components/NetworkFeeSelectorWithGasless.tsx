import React from 'react'
import { Space } from 'common/components/Space'
import { Text, useTheme, View, Toggle, alpha } from '@avalabs/k2-alpine'
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
  errorMessage: string | undefined
}

export const NetworkFeeSelectorWithGasless = ({
  gaslessEnabled,
  setGaslessEnabled,
  shouldShowGaslessSwitch,
  gasLimit,
  caip2ChainId,
  handleFeesChange,
  errorMessage
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
          testID={gaslessEnabled ? 'gasless_on' : 'gasless_off'}
          value={gaslessEnabled}
          onValueChange={() => setGaslessEnabled(prevState => !prevState)}
        />
      </View>
    )
  }

  // Async-resolved fee data readiness (chain + gas limit). Drives the reflow key
  // below. Kept separate from the user's gasless toggle so toggling gasless does
  // NOT remount the subtree (the Toggle keeps its press animation).
  const isFeeDataReady = !!chainId && !!gasLimit

  const renderNetworkFeeSelector = (): JSX.Element | null => {
    if (gaslessEnabled && shouldShowGaslessSwitch) return null
    // Narrow chainId/gasLimit inline (mirrors `isFeeDataReady`) so TS knows
    // they're defined when passed to NetworkFeeSelector.
    if (!chainId || !gasLimit) return null

    return (
      <NetworkFeeSelector
        chainId={chainId}
        gasLimit={gasLimit}
        onFeesChange={handleFeesChange}
      />
    )
  }

  // CP-14599: the gasless toggle row and the network-fees rows each become
  // visible asynchronously (the toggle once `shouldShowGaslessSwitch` resolves,
  // the fee rows once `gasLimit` resolves). Under Fabric, inserting/growing one
  // of these does not reliably reflow the already-laid-out sibling, so the two
  // rows paint on top of each other. Remounting this subtree whenever that async
  // visibility flips forces a clean layout pass so the rows stack with the
  // toggle's `marginBottom` spacing intact. The key is keyed on async-resolved
  // visibility (not the user's gasless toggle) so it flips once as the data
  // settles and stays stable afterwards — the Toggle keeps its own animation.
  const reflowKey = `gasless:${shouldShowGaslessSwitch}-fee:${isFeeDataReady}`

  return (
    <View key={reflowKey}>
      {renderGaslessSwitch()}
      {renderNetworkFeeSelector()}
      {errorMessage && (
        <Text
          variant="caption"
          sx={{ color: '$textDanger', alignSelf: 'center', marginTop: 8 }}>
          {errorMessage}
        </Text>
      )}
    </View>
  )
}
