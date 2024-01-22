import { TokenBaseUnit } from 'types/TokenBaseUnit'

export interface NetworkFee<T extends TokenBaseUnit<T>> {
  baseFee?: T
  low: FeeRate<T>
  medium: FeeRate<T>
  high: FeeRate<T>
  isFixedFee: boolean
}

export type FeeRate<T extends TokenBaseUnit<T>> = {
  maxFeePerGas: T
  maxPriorityFeePerGas?: T
}
