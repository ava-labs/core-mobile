import { BigNumber } from 'ethers'
import { TransactionParams } from 'store/walletConnect/handlers/eth_sendTransaction'

export async function txToCustomEvmTx(
  networkFee: BigNumber,
  txParams: TransactionParams
) {
  if (!txParams) {
    throw new Error('params is malformed')
  }

  const { gas, to, from, data, value, gasPrice } = txParams

  const sureGasPrice = BigNumber.from(gasPrice ?? networkFee)

  if (!gas || !sureGasPrice) {
    throw new Error('Gas or gas estimate is malformed')
  }

  if (!to && !data) {
    throw new Error('the to or data is malformed')
  }

  const gasLimit = Number(gas)

  return {
    gasPrice: sureGasPrice,
    gasLimit: gasLimit,
    to,
    from,
    data,
    value
  }
}
