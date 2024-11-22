import { pvm } from '@avalabs/avalanchejs'
import { useCallback } from 'react'
import { useDefaultFeeState } from './useDefaultFeeState'

export const useGetFeeState = (): {
  defaultFeeState: pvm.FeeState | undefined
  getFeeState: (gasPrice?: bigint) => pvm.FeeState | undefined
} => {
  const { data: defaultFeeState } = useDefaultFeeState()

  const getFeeState = useCallback(
    (gasPrice?: bigint) => {
      return defaultFeeState
        ? { ...defaultFeeState, price: gasPrice ?? defaultFeeState.price }
        : undefined
    },
    [defaultFeeState]
  )

  return { getFeeState, defaultFeeState }
}
