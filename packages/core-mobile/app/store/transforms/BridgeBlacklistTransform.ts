import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { createTransform } from 'redux-persist'
import Big from 'big.js'
import { RawRootState } from 'store/types'
import { BridgeState, reducerName } from 'store/bridge'

// a transform for bridge that transforms Big string to Big during deserialization
export const BridgeBlacklistTransform = createTransform<
  BridgeState,
  BridgeState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: BridgeState) => {
    return {
      bridgeTransactions: inboundState.bridgeTransactions
    }
  },
  // transform state after it gets rehydrated
  (outboundState: BridgeState) => {
    // for bridge transactions, we need to convert Big string values back to Big
    const bridgeTransactions = Object.entries(
      outboundState.bridgeTransactions
    ).reduce<Record<string, BridgeTransaction>>((txs, [txHash, tx]) => {
      txs[txHash] = {
        ...tx,
        amount: new Big(tx.amount),
        sourceNetworkFee: tx.sourceNetworkFee && new Big(tx.sourceNetworkFee),
        targetNetworkFee: tx.targetNetworkFee && new Big(tx.targetNetworkFee)
      }
      return txs
    }, {})

    return {
      bridgeTransactions
    }
  },
  {
    whitelist: [reducerName]
  }
)
