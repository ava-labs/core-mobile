export interface NetworkFee {
  baseFee?: bigint
  low: FeeRate
  medium: FeeRate
  high: FeeRate
  isFixedFee: boolean
}

export type FeeRate = {
  maxFeePerGas: bigint
  maxPriorityFeePerGas?: bigint
}
