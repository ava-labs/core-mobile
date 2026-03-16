import Big from 'big.js'
import { Blockchain, BridgeTransaction } from '@avalabs/core-bridge-sdk'
import {
  addBridgeTransaction,
  bridgeReducer as reducer,
  popBridgeTransaction
} from './slice'
import { initialState } from './types'

const bridgeTx1: BridgeTransaction = {
  addressC: '1234',
  addressBTC: '5678',
  amount: new Big(0),
  symbol: 'symbol',
  complete: false,
  environment: 'main',
  sourceChain: Blockchain.AVALANCHE,
  sourceStartedAt: 122,
  sourceTxHash: '3dfdfx',
  confirmationCount: 22,
  requiredConfirmationCount: 33,
  targetChain: Blockchain.ETHEREUM
}

const bridgeTx2: BridgeTransaction = {
  addressC: '3445',
  addressBTC: '54567',
  amount: new Big(1),
  symbol: 'symbol',
  complete: false,
  environment: 'main',
  sourceChain: Blockchain.AVALANCHE,
  sourceStartedAt: 2122,
  sourceTxHash: '2dfdfx',
  confirmationCount: 42,
  requiredConfirmationCount: 53,
  targetChain: Blockchain.ETHEREUM
}

describe('bridge - reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toBe(initialState)
  })

  describe('addBridgeTransaction', () => {
    it('should save new transaction', () => {
      const currentState = {
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1
        }
      }
      const state = reducer(currentState, addBridgeTransaction(bridgeTx2))

      expect(state).toStrictEqual({
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1,
          [bridgeTx2.sourceTxHash]: bridgeTx2
        }
      })
    })

    it('should update existing transaction', () => {
      const newBridgeTx = {
        ...bridgeTx1,
        confirmationCount: 55
      }
      const currentState = {
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1
        }
      }
      const state = reducer(currentState, addBridgeTransaction(newBridgeTx))

      expect(state).toStrictEqual({
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: newBridgeTx
        }
      })
    })
  })

  describe('popBridgeTransaction', () => {
    it('should remove transaction if exists', () => {
      const currentState = {
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1,
          [bridgeTx2.sourceTxHash]: bridgeTx2
        }
      }
      const state = reducer(
        currentState,
        popBridgeTransaction(bridgeTx2.sourceTxHash)
      )

      expect(state).toStrictEqual({
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1
        }
      })
    })

    it('should do nothing when specified transaction does not exist', () => {
      const currentState = {
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1,
          [bridgeTx2.sourceTxHash]: bridgeTx2
        }
      }
      const state = reducer(currentState, popBridgeTransaction('randomHash'))

      expect(state).toStrictEqual({
        bridgeTransactions: {
          [bridgeTx1.sourceTxHash]: bridgeTx1,
          [bridgeTx2.sourceTxHash]: bridgeTx2
        }
      })
    })
  })
})
