import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useGetClaimableBalance = (): TokenUnit | undefined => {
  const pChainBalance = usePChainBalance()
  const unlockedUnstakedNAvax =
    pChainBalance.data?.balancePerType.unlockedUnstaked
  const hasErrors = pChainBalance.error || !pChainBalance.data
  const dataReady = !pChainBalance.isLoading && !hasErrors
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useMemo(() => {
    if (dataReady && unlockedUnstakedNAvax !== undefined) {
      return new TokenUnit(
        unlockedUnstakedNAvax,
        networkToken.decimals,
        networkToken.symbol
      )
    }
    return undefined
  }, [
    dataReady,
    networkToken.decimals,
    networkToken.symbol,
    unlockedUnstakedNAvax
  ])
}
