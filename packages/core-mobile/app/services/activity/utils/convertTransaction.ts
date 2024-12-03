import {
  Transaction as InternalTransaction,
  TransactionType
} from '@avalabs/vm-module-types'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { Transaction } from 'store/transaction'
import { getCaip2ChainId } from 'utils/caip2ChainIds'

export const convertTransaction = (
  transaction: InternalTransaction,
  shouldAnalyzeBridgeTxs: boolean
): Transaction => {
  const bridgeAnalysis = shouldAnalyzeBridgeTxs
    ? UnifiedBridgeService.analyzeTx({
        chainId: getCaip2ChainId(Number(transaction.chainId)),
        from: transaction.from,
        to: transaction.to,
        tokenTransfers: transaction.tokens.map(token => {
          return {
            from: token.from?.address,
            to: token.to?.address,
            symbol: token.symbol
          }
        })
      })
    : undefined

  return {
    ...transaction,
    bridgeAnalysis,
    txType:
      bridgeAnalysis?.isBridgeTx === true
        ? TransactionType.BRIDGE
        : transaction.txType
        ? transaction.txType
        : TransactionType.UNKNOWN
  }
}
