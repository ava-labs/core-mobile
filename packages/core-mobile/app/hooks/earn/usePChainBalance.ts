import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { refetchIntervals } from 'consts/earn'
import NetworkService from 'services/network/NetworkService'
import { selectSelectedCurrency } from 'store/settings/currency'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'

export const usePChainBalance = (): UseQueryResult<
  TokenWithBalancePVM | undefined,
  Error
> => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: !!addressPVM,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM, selectedCurrency],
    queryFn: async () => {
      if (addressPVM === undefined) {
        return
      }
      const balancesResponse = await ModuleManager.avalancheModule.getBalances({
        addresses: [addressPVM],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: coingeckoInMemoryCache
      })
      const pChainBalance =
        balancesResponse[addressPVM]?.[network.networkToken.symbol]
      if (
        pChainBalance === undefined ||
        !isTokenWithBalancePVM(pChainBalance)
      ) {
        return
      }
      return pChainBalance
    }
  })
}
