import { BridgeTransaction } from '@avalabs/bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
  isMainnet: boolean
}

export const defaultBridgeState: BridgeState = {
  bridgeTransactions: {},
  isMainnet: false
}
