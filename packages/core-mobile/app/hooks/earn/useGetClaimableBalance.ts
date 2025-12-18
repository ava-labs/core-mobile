import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useGetClaimableBalance = (): TokenUnit | undefined => {
  const pChainBalance = usePChainBalance()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useMemo(() => {
    if (pChainBalance?.balancePerType.unlockedUnstaked !== undefined) {
      return new TokenUnit(
        pChainBalance.balancePerType.unlockedUnstaked,
        networkToken.decimals,
        networkToken.symbol
      )
    }
    return undefined
  }, [
    networkToken.decimals,
    networkToken.symbol,
    pChainBalance?.balancePerType.unlockedUnstaked
  ])
}
