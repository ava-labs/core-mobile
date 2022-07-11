import { BN, bigToLocaleString, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import { GasPrice } from 'utils/GasPriceHook'

export type Fees = {
  gasPrice: GasPrice
  gasLimit: number
  fee: string
  bnFee: BN
  feeUSD: number
}
