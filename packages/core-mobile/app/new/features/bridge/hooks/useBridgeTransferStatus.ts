import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { isUnifiedBridgeTransfer } from '../utils/bridgeUtils'

const defaultValues = {
  isComplete: false,
  sourceCurrentConfirmations: 0,
  targetCurrentConfirmations: 0,
  sourceRequiredConfirmations: 0,
  targetRequiredConfirmations: 0
}

export const useBridgeTransferStatus = (
  bridgeTx?: BridgeTransaction | BridgeTransfer
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

  if (isUnifiedBridgeTransfer(bridgeTx)) {
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

  return {
    isComplete: bridgeTx.complete,
    // cap the current confirmations so we don't go over
    sourceCurrentConfirmations: Math.min(
      bridgeTx.confirmationCount,
      bridgeTx.requiredConfirmationCount
    ),
    // with Legacy Bridge, the count is either 0 if tx has not completed yet, or 1 if it has
    targetCurrentConfirmations: bridgeTx.complete ? 1 : 0,
    sourceRequiredConfirmations: bridgeTx.requiredConfirmationCount,
    targetRequiredConfirmations: 1 // and we only require one confirmation on the target blockchain
  }
}
