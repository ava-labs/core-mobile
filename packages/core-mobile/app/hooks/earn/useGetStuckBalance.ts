import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useGetStuckBalance = (): TokenUnit | undefined => {
  const pChainBalance = usePChainBalance()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useMemo(() => {
    if (pChainBalance?.balancePerType.atomicMemoryUnlocked !== undefined) {
      return new TokenUnit(
        pChainBalance?.balancePerType.atomicMemoryUnlocked,
        networkToken.decimals,
        networkToken.symbol
      )
    }
    return undefined
  }, [
    networkToken.decimals,
    networkToken.symbol,
    pChainBalance?.balancePerType.atomicMemoryUnlocked
  ])
}
