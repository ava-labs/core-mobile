import { BridgeTransaction } from '@avalabs/bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
}

export interface BridgeReducerState {
  bridge: BridgeState
}

export const defaultBridgeState: BridgeState = {
  bridgeTransactions: {}
}

export const initialState: BridgeReducerState = {
  bridge: defaultBridgeState
}
