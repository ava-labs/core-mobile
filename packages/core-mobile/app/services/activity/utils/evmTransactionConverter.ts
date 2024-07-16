import {
  Transaction as EvmTransaction,
  TransactionType,
  TokenType
} from '@avalabs/vm-module-types'
import { NULL_ADDRESS } from 'screens/bridge/utils/bridgeUtils'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { Transaction } from 'store/transaction'

export const convertTransaction = (
  transaction: EvmTransaction
): Transaction => {
  const bridgeAddresses = UnifiedBridgeService.getBridgeAddresses()
  const isBridge =
    transaction.tokens[0]?.type === TokenType.ERC20 &&
    [
      transaction.tokens[0].to?.address.toLowerCase(),
      transaction.tokens[0].from?.address.toLowerCase()
    ].some(item => item && [...bridgeAddresses, NULL_ADDRESS].includes(item))

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
