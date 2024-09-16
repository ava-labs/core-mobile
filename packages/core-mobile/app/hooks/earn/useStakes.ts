import { PChainTransaction } from '@avalabs/glacier-sdk'
import { UseQueryResult } from '@tanstack/react-query'
import { refetchIntervals } from 'consts/earn'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { WalletState } from 'store/app'
import { selectWalletState } from 'store/app/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type UseStakesReturnType = UseQueryResult<PChainTransaction[], unknown> & {
  pullToRefresh: () => void
  readonly isRefreshing: boolean
}

export const useStakes = (): UseStakesReturnType => {
  const walletState = useSelector(selectWalletState)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectActiveAccount)
  const pAddress = account?.addressPVM ?? ''

  // we only fetch stakes when the wallet is active
  // otherwise, it will be fetching even when the wallet is locked
  // and on some Android devices, it can continue running even if app
  // is in the background, which can lead to getting rate limited by glacier
  const enabled = Boolean(pAddress) && walletState === WalletState.ACTIVE

  return useRefreshableQuery({
    refetchInterval: refetchIntervals.stakes,
    enabled,
    queryKey: ['stakes', isDeveloperMode, pAddress],
    queryFn: () =>
      EarnService.getAllStakes({
        isTestnet: isDeveloperMode,
        addresses: [pAddress]
      })
  })
}
