import { useMemo } from 'react'
import { useSwapList } from './useSwapList'

export const useIsSwapListLoaded = (): boolean => {
  const swapList = useSwapList()

  return useMemo(() => {
    return swapList.length > 0
  }, [swapList.length])
}
