import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { refetchIntervals } from 'consts/earn'
import NetworkService from 'services/network/NetworkService'
import { selectSelectedCurrency } from 'store/settings/currency'
import * as inMemoryCache from 'utils/InMemoryCache'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'

export const usePChainBalance = (): UseQueryResult<
  TokenWithBalancePVM | undefined,
  Error
> => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: !!addressPVM,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM, selectedCurrency],
    queryFn: async () => {
      if (addressPVM === undefined) {
        return
      }
      const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)
      const module = await ModuleManager.loadModuleByNetwork(network)
      const balancesResponse = await module.getBalances({
        addresses: [addressPVM],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: {
          get: inMemoryCache.getCache,
          set: inMemoryCache.setCache
        }
      })
      return balancesResponse[addressPVM]?.[network.networkToken.symbol]
    }
  })
}
