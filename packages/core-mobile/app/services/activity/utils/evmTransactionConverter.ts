import {
  Transaction as EvmTransaction,
  TransactionType,
  TokenType
} from '@internal/types'
import { NULL_ADDRESS } from 'screens/bridge/utils/bridgeUtils'
import { Transaction } from 'store/transaction'

export const convertTransaction = (
  transaction: EvmTransaction,
  bridgeAddresses: string[]
): Transaction => {
  const isBridge =
    transaction.tokens[0]?.type === TokenType.ERC20 &&
    [
      transaction.tokens[0].to?.address.toLowerCase(),
      transaction.tokens[0].from?.address.toLowerCase()
    ].some(item => item && [NULL_ADDRESS, ...bridgeAddresses].includes(item))

  return {
    ...transaction,
    isBridge,
    txType: isBridge
      ? TransactionType.BRIDGE
      : transaction.txType
      ? transaction.txType
      : TransactionType.UNKNOWN
  }
}
