// The Swimmer subnet is the only one with fixed fee.
export interface NetworkFee {
  displayDecimals: number
  nativeTokenDecimals: number
  unit: string
  low: bigint
  medium: bigint
  high: bigint
  isFixedFee: boolean
  nativeTokenSymbol: string
}
