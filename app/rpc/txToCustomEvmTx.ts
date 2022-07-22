import { Transaction } from 'rpc/models'
import { hexToBN } from '@avalabs/utils-sdk'
import { GasPrice } from 'utils/GasPriceHook'

export function txToCustomEvmTx(gasPrice: GasPrice, tx?: Transaction) {
  if (!tx) {
    throw new Error('transaction is malformed')
  }

  const txParams = tx.txParams
  const { gas, to, from, data, value } = txParams

  if (!gas || !gasPrice) {
    throw new Error('Gas or gas estimate is malformed')
  }

  if (!to && !data) {
    throw new Error('the to or data is malformed')
  }

  const gasLimit = Number(gas)
  const bnGasPrice = gasPrice.bn

  return {
    gasPrice: bnGasPrice || gasPrice.bn,
    gasLimit: gasLimit,
    to,
    from,
    data,
    value
  }
}
