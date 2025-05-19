import { useCallback } from 'react'
import { ChainId } from '@avalabs/core-chains-sdk'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSwapList } from './useSwapList'

const SUPPORTED_CHAIN_IDS = [ChainId.AVALANCHE_MAINNET_ID]

export const useIsSwappable = (): {
  isSwappable: ({
    tokenAddress,
    chainId
  }: {
    tokenAddress: string | undefined
    chainId: number | undefined
  }) => boolean
} => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const swapList = useSwapList()

  const isSwappable = useCallback(
    ({
      tokenAddress,
      chainId
    }: {
      tokenAddress: string | undefined
      chainId: number | undefined
    }): boolean => {
      if (!tokenAddress) return false

      if (chainId === undefined || !SUPPORTED_CHAIN_IDS.includes(chainId))
        return false

      if (isDeveloperMode) return false

      const foundToken = swapList.find(
        tk => tk.localId.toLowerCase() === tokenAddress.toLowerCase()
      )

      return !!foundToken
    },
    [swapList, isDeveloperMode]
  )

  return {
    isSwappable
  }
}
