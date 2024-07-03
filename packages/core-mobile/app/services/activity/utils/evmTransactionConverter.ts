import {
  Transaction as EvmTransaction,
  TransactionType,
  TokenType
} from '@avalabs/vm-module-types'
import { Transaction } from 'store/transaction'
import { isBridge } from 'utils/isBridge'

export const convertTransaction = (
  transaction: EvmTransaction
): Transaction => {
  const isBridgeTx =
    transaction.tokens[0]?.type === TokenType.ERC20 &&
    [
      transaction.tokens[0].to?.address.toLowerCase(),
      transaction.tokens[0].from?.address.toLowerCase()
    ].some(item => item && isBridge(item))

  return {
    ...transaction,
    isBridge: isBridgeTx,
    txType: isBridgeTx
      ? TransactionType.BRIDGE
      : transaction.txType
      ? transaction.txType
      : TransactionType.UNKNOWN
  }
}
