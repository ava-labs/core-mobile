import { useMemo } from 'react'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import Big from 'big.js'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { isUnifiedBridgeTransfer } from 'common/utils/bridgeUtils'

export const useBridgeAmounts = (
  bridgeTx?: BridgeTransaction | BridgeTransfer
): {
  amount: Big | undefined
  sourceNetworkFee: Big | undefined
} => {
  const sourceNetworkFee = useMemo(() => {
    if (typeof bridgeTx?.sourceNetworkFee === 'undefined') {
      return
    }

    if (isUnifiedBridgeTransfer(bridgeTx)) {
      return bigintToBig(
        bridgeTx.sourceNetworkFee,
        bridgeTx.sourceChain.networkToken.decimals
      )
    }
    return bridgeTx.sourceNetworkFee
  }, [bridgeTx])

  return {
    amount: isUnifiedBridgeTransfer(bridgeTx)
      ? bigintToBig(bridgeTx.amount, bridgeTx.asset.decimals)
      : bridgeTx?.amount,
    sourceNetworkFee
  }
}
