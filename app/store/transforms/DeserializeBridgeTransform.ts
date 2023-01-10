import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { createTransform } from 'redux-persist'
import Big from 'big.js'
import { RawRootState } from 'store'
import { BridgeState } from 'store/bridge'

/**
 * Deserialize bridgeState after retrieving from storage.
 * (i.e. convert Big string values back to Big)
 */
const deserializeBridgeState = (state: BridgeState) => {
  const bridgeTransactions = Object.entries(state.bridgeTransactions).reduce<
    Record<string, BridgeTransaction>
  >((txs, [txHash, tx]) => {
    txs[txHash] = {
      ...tx,
      amount: new Big(tx.amount),
      sourceNetworkFee: tx.sourceNetworkFee && new Big(tx.sourceNetworkFee),
      targetNetworkFee: tx.targetNetworkFee && new Big(tx.targetNetworkFee)
    }
    return txs
  }, {})

  return {
    ...state,
    bridgeTransactions: bridgeTransactions
  }
}

export const DeserializeBridgeTransform = createTransform<
  BridgeState,
  BridgeState,
  RawRootState,
  RawRootState
>(null, deserializeBridgeState, { whitelist: ['bridge'] })
