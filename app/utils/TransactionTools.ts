import {
  isTransactionNormal,
  TransactionERC20,
  TransactionNormal
} from '@avalabs/wallet-react-components'

export function isIncomingTransaction(
  tx: TransactionERC20 | TransactionNormal
) {
  if ('isSender' in tx) {
    return !tx.isSender
  }
  return false
}

export function isOutgoingTransaction(
  tx: TransactionERC20 | TransactionNormal
) {
  if ('isSender' in tx) {
    return tx.isSender
  }
  return false
}

export function isContractCallTransaction(
  tx: TransactionERC20 | TransactionNormal
) {
  if ('input' in tx) {
    return isTransactionNormal(tx) && tx.input !== '0x'
  }
  return false
}
