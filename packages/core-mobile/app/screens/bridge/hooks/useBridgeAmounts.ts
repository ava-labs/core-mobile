import { useMemo } from 'react'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import Big from 'big.js'

export const useBridgeAmounts = (
  bridgeTx?: BridgeTransfer
): {
  amount: Big | undefined
  sourceNetworkFee: Big | undefined
} => {
  const sourceNetworkFee = useMemo(() => {
    if (typeof bridgeTx?.sourceNetworkFee === 'undefined') {
      return
    }

    return bigintToBig(
      bridgeTx.sourceNetworkFee,
      bridgeTx.sourceChain.networkToken.decimals
    )
  }, [bridgeTx])

  return {
    amount: bridgeTx
      ? bigintToBig(bridgeTx.amount, bridgeTx.asset.decimals)
      : undefined,
    sourceNetworkFee
  }
}
