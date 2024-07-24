import { BridgeTransfer } from '@avalabs/bridge-unified'

export type SourceTxHash = string

export type PendingTransfers = Record<SourceTxHash, BridgeTransfer>

export interface UnifiedBridgeState {
  pendingTransfers: PendingTransfers
}

export const initialState: UnifiedBridgeState = {
  pendingTransfers: {}
}
