import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveNetwork } from 'store/network'
import { isDevnet } from 'utils/isDevnet'

export const useGetStuckBalance = (): TokenUnit | undefined => {
  const pChainBalance = usePChainBalance()
  const atomicMemoryUnlockedNAvax =
    pChainBalance.data?.balancePerType.atomicMemoryUnlocked
  const hasErrors = pChainBalance.error || !pChainBalance.data
  const dataReady = !pChainBalance.isLoading && !hasErrors
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeNetwork = useSelector(selectActiveNetwork)
  const { networkToken } = NetworkService.getAvalancheNetworkP(
    isDeveloperMode,
    isDevnet(activeNetwork)
  )

  return useMemo(() => {
    if (dataReady && atomicMemoryUnlockedNAvax !== undefined) {
      return new TokenUnit(
        atomicMemoryUnlockedNAvax,
        networkToken.decimals,
        networkToken.symbol
      )
    }
    return undefined
  }, [
    dataReady,
    networkToken.decimals,
    networkToken.symbol,
    atomicMemoryUnlockedNAvax
  ])
}
