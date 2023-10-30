import { BridgeConfig, BridgeTransaction } from '@avalabs/bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
  config: BridgeConfig | undefined
}

export const initialState: BridgeState = {
  bridgeTransactions: {},
  config: undefined
}
