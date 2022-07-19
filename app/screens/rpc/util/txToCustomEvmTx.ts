import { TransactionParams } from 'screens/rpc/util/types'
import { BigNumber } from 'ethers'

export async function txToCustomEvmTx(
  gasPrice: BigNumber,
  txParams: TransactionParams
) {
  if (!txParams) {
    throw new Error('params is malformed')
  }

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
