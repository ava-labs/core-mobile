import { PChainTransaction, SortOrder } from '@avalabs/glacier-sdk'
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

export const useStakes = (
  sortOrder: SortOrder = SortOrder.DESC
): UseStakesReturnType => {
  const walletState = useSelector(selectWalletState)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectActiveAccount)
  // make pAddresses fallback to addressPVM if xpAddresses is empty/undefined
  const xpAddresses =
    account?.xpAddresses?.map(address => address.address) ?? []
  const pAddresses =
    xpAddresses.length > 0 ? xpAddresses : [account?.addressPVM ?? '']
  const pAddressesSorted = pAddresses.sort().join(',')

  // we only fetch stakes when the wallet is active
  // otherwise, it will be fetching even when the wallet is locked
  // and on some Android devices, it can continue running even if app
  // is in the background, which can lead to getting rate limited by glacier
  const isWalletActive = walletState === WalletState.ACTIVE

  // when we toggle developer mode, it will take a brief moment for the address to update
  // in that brief moment, we don't want to fetch the stakes as the address will still be the old one
  // this check is to ensure that the address is of the correct developer mode before fetching the stakes
  const isAddressesValid = pAddresses.every(
    address =>
      address.trim() !== '' &&
      (isDeveloperMode ? address.includes('fuji') : !address.includes('fuji'))
  )

  const enabled = isWalletActive && isAddressesValid

  return useRefreshableQuery({
    refetchInterval: refetchIntervals.stakes,
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['stakes', isDeveloperMode, pAddressesSorted, sortOrder],
    queryFn: () =>
      EarnService.getAllStakes({
        isTestnet: isDeveloperMode,
        addresses: pAddresses,
        sortOrder
      })
  })
}
