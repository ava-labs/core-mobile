import { pvm } from '@avalabs/avalanchejs'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useCallback, useEffect, useState } from 'react'
import Logger from 'utils/Logger'

export const useGetFeeState = (): {
  getFeeState: (gasPrice?: bigint) => pvm.FeeState | undefined
} => {
  const xpProvider = useAvalancheXpProvider()
  const [feeState, setFeeState] = useState<pvm.FeeState | undefined>(undefined)

  useEffect(() => {
    const fetchFeeState = async (): Promise<void> => {
      if (xpProvider === undefined) return
      const fee = await xpProvider
        .getApiP()
        .getFeeState()
        .catch(() => undefined)
      setFeeState(fee)
    }
    fetchFeeState().catch(Logger.error)
  }, [xpProvider])

  const getFeeState = useCallback(
    (gasPrice?: bigint) => {
      return feeState
        ? { ...feeState, price: gasPrice ?? feeState.price }
        : undefined
    },
    [feeState]
  )

  return { getFeeState }
}
