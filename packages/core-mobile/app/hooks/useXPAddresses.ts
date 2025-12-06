import { skipToken, useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { Account } from 'store/account/types'
import {
  getAddressesFromXpubXP,
  GetAddressesFromXpubResult
} from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveWallet } from 'store/wallet/slice'

const STALE_TIME = 60000 // 1 minute

export const useXPAddresses = (
  account?: Account
): UseQueryResult<GetAddressesFromXpubResult, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeWallet = useSelector(selectActiveWallet)

  const shouldDisable = !activeWallet || !account

  return useQuery({
    staleTime: STALE_TIME,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.XP_ADDRESSES,
      activeWallet?.id,
      account?.id,
      isDeveloperMode
    ],
    queryFn: shouldDisable
      ? skipToken
      : () => {
          return getAddressesFromXpubXP({
            isDeveloperMode,
            walletId: activeWallet.id,
            walletType: activeWallet.type,
            accountIndex: account.index,
            onlyWithActivity: true
          })
        }
  })
}
