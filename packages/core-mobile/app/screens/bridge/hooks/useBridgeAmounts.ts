import { useMemo } from 'react'
import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/utils-sdk'
import Big from 'big.js'
import { isUnifiedBridgeTransfer } from '../utils/bridgeUtils'

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
      ? bigintToBig(bridgeTx.amount, bridgeTx.amountDecimals)
      : bridgeTx?.amount,
    sourceNetworkFee
  }
}
