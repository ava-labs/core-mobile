import { BigNumber } from 'ethers'

// The Swimmer subnet is the only one with fixed fee.
export interface NetworkFee {
  displayDecimals: number
  low: BigNumber
  medium: BigNumber
  high: BigNumber
  isFixedFee: boolean
}

export type SerializedNetworkFee = Omit<
  NetworkFee,
  'low' | 'medium' | 'high'
> & {
  low: { type: 'BigNumber'; hex: string }
  medium: { type: 'BigNumber'; hex: string }
  high: { type: 'BigNumber'; hex: string }
  isFixedFee: boolean
}
