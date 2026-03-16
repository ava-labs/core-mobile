import { BridgeTransaction } from '@avalabs/core-bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
}

export const initialState: BridgeState = {
  bridgeTransactions: {}
}
