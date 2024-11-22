import { pvm } from '@avalabs/avalanchejs'
import { useCallback } from 'react'
import { useDefaultFeeState } from './useDefaultFeeState'

export const useGetFeeState = (): {
  defaultFeeState: pvm.FeeState | undefined
  getFeeState: (gasPrice?: bigint) => pvm.FeeState | undefined
} => {
  const { data: defaultFeeState, error } = useDefaultFeeState()

  const getFeeState = useCallback(
    (gasPrice?: bigint) => {
      return defaultFeeState && !error
        ? { ...defaultFeeState, price: gasPrice ?? defaultFeeState.price }
        : undefined
    },
    [defaultFeeState, error]
  )

  return { getFeeState, defaultFeeState }
}
