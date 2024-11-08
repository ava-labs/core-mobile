import { BridgeTransfer } from '@avalabs/bridge-unified'

const defaultValues = {
  isComplete: false,
  sourceCurrentConfirmations: 0,
  targetCurrentConfirmations: 0,
  sourceRequiredConfirmations: 0,
  targetRequiredConfirmations: 0
}

export const useBridgeTransferStatus = (
  bridgeTx?: BridgeTransfer
): {
  isComplete: boolean
  sourceCurrentConfirmations: number
  targetCurrentConfirmations: number
  sourceRequiredConfirmations: number
  targetRequiredConfirmations: number
} => {
  if (!bridgeTx) {
    return defaultValues
  }

  return {
    isComplete: Boolean(bridgeTx.completedAt),
    // cap the current confirmations so we don't go over
    sourceCurrentConfirmations: Math.min(
      bridgeTx.sourceConfirmationCount,
      bridgeTx.sourceRequiredConfirmationCount
    ),
    targetCurrentConfirmations: Math.min(
      bridgeTx.targetConfirmationCount,
      bridgeTx.targetRequiredConfirmationCount
    ),
    // with Unified Bridge, the SDK provides info about the target confirmations
    sourceRequiredConfirmations: bridgeTx.sourceRequiredConfirmationCount,
    targetRequiredConfirmations: bridgeTx.targetRequiredConfirmationCount
  }
}
