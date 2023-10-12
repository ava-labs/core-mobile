import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { BigNumberish } from 'ethers/src.ts/utils/maths'

export async function txToCustomEvmTx(
  networkFee: bigint,
  txParams: TransactionParams
): Promise<{
  gasLimit: number
  data: string | undefined
  from: string
  to: string
  value: BigNumberish | undefined
  gasPrice: bigint
}> {
  if (!txParams) {
    throw new Error('params is malformed')
  }

  const { gas, to, from, data, value, gasPrice } = txParams

  //gasPrice comes in hex form but not prefixed with 0x (eg. 6b1a22f80)
  let hexGasPrice = gasPrice
  if (hexGasPrice?.startsWith('0x') === false) {
    hexGasPrice = hexGasPrice.length % 2 ? '0x0' : '0x' + hexGasPrice
  }
  const sureGasPrice = BigInt(hexGasPrice ?? networkFee)

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
