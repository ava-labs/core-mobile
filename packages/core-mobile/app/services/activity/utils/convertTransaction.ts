import {
  Transaction as InternalTransaction,
  TransactionType
} from '@avalabs/vm-module-types'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { Transaction } from 'store/transaction'

export const convertTransaction = (
  transaction: InternalTransaction
): Transaction => {
  const bridgeAnalysis = UnifiedBridgeService.analyzeTx({
    chainId: transaction.chainId,
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

  return {
    ...transaction,
    bridgeAnalysis,
    txType: bridgeAnalysis.isBridgeTx
      ? TransactionType.BRIDGE
      : transaction.txType
      ? transaction.txType
      : TransactionType.UNKNOWN
  }
}
