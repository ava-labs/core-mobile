import { BridgeTransaction } from '@avalabs/bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
}

export const defaultBridgeState: BridgeState = {
  bridgeTransactions: {}
}
