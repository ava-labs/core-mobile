import { Transaction } from 'screens/rpc/util/types'
import { BigNumber } from 'ethers'

export function txToCustomEvmTx(gasPrice: BigNumber, tx?: Transaction) {
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

  return {
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to,
    from,
    data,
    value
  }
}
