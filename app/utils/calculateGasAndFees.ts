import { BN, bigToLocaleString, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import { GasPrice } from 'utils/GasPriceHook'

export type Fees = {
  gasPrice: GasPrice
  gasLimit: number
  fee: string
  bnFee: BN
  feeUSD: number
}

export function calculateGasAndFees(
  gasPrice: GasPrice,
  gasLimit: string,
  avaxPrice: number
): Fees {
  const bnFee = gasPrice.bn.mul(new BN(parseInt(gasLimit)))
  const fee = bigToLocaleString(bnToBig(bnFee, 18), 4)
  return {
    gasPrice: gasPrice,
    gasLimit: parseInt(gasLimit),
    fee,
    bnFee,
    feeUSD: parseFloat((parseFloat(fee) * avaxPrice).toFixed(4))
  }
}
