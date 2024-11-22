import { useGetFeeState } from './useGetFeeState'

export const useIsNetworkFeeExcessive = (gasPrice?: bigint): boolean => {
  const { defaultFeeState } = useGetFeeState()

  return (
    !!defaultFeeState?.price &&
    !!gasPrice &&
    gasPrice > defaultFeeState.price * 2n
  )
}
