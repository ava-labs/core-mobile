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

export type SerializedNetworkFee = Omit<
  NetworkFee,
  'low' | 'medium' | 'high'
> & {
  low: { type: 'BigInt'; hex: string }
  medium: { type: 'BigInt'; hex: string }
  high: { type: 'BigInt'; hex: string }
  isFixedFee: boolean
  nativeTokenSymbol: string
  unit: string
  displayDecimals: number
  nativeTokenDecimals: number
}
