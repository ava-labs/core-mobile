import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { refetchIntervals } from 'consts/earn'
import NetworkService from 'services/network/NetworkService'
import { selectSelectedCurrency } from 'store/settings/currency'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isDevnet } from 'utils/isDevnet'
import { selectActiveNetwork } from 'store/network'
import { getPChainBalance } from 'services/balance/getPChainBalance'

export const usePChainBalance = (): UseQueryResult<
  TokenWithBalancePVM | undefined,
  Error
> => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const activeNetwork = useSelector(selectActiveNetwork)
  const network = NetworkService.getAvalancheNetworkP(
    isDeveloperMode,
    isDevnet(activeNetwork)
  )

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: !!addressPVM,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM, selectedCurrency],
    queryFn: async () => {
      if (addressPVM === undefined) {
        return
      }

      return getPChainBalance({
        pAddress: addressPVM,
        currency: selectedCurrency,
        avaxXPNetwork: network
      })
    }
  })
}
