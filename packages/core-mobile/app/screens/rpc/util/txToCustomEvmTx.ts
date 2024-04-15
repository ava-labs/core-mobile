import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { BigNumberish } from 'ethers'

export async function txToCustomEvmTx(
  networkFee: bigint,
  txParams: TransactionParams
): Promise<{
  gasLimit: number
  data: string | undefined
  from: string
  to: string
  value: BigNumberish | undefined
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}> {
  if (!txParams) {
    throw new Error('params is malformed')
  }

  const { gas, to, from, data, value, maxFeePerGas, maxPriorityFeePerGas } =
    txParams

  const sureGasPrice = BigInt(maxFeePerGas ?? networkFee)

  if (!gas || !sureGasPrice) {
    throw new Error('Gas or gas estimate is malformed')
  }

  if (!to && !data) {
    throw new Error('the to or data is malformed')
  }

  const gasLimit = Number(gas)

  return {
    maxFeePerGas: sureGasPrice,
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas ?? 0n),
    gasLimit: gasLimit,
    to,
    from,
    data,
    value
  }
}
