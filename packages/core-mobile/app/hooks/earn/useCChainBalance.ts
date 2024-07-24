import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { refetchIntervals } from 'consts/earn'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import * as inMemoryCache from 'utils/InMemoryCache'
import { TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import useCChainNetwork from './useCChainNetwork'

export const useCChainBalance = (): UseQueryResult<
  TokenWithBalanceEVM | undefined,
  Error
> => {
  const network = useCChainNetwork()
  const addressC = useSelector(selectActiveAccount)?.addressC ?? ''
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: Boolean(addressC),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['cChainBalance', isDeveloperMode, addressC, selectedCurrency],
    queryFn: async () => {
      if (
        network === undefined ||
        isBitcoinChainId(network.chainId) ||
        isXPChain(network.chainId)
      ) {
        return Promise.reject(
          'Chain id not compatible, skipping getNativeBalance'
        )
      }

      const module = await ModuleManager.loadModuleByNetwork(network)
      const balancesResponse = await module.getBalances({
        addresses: [addressC],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: {
          get: inMemoryCache.getCache,
          set: inMemoryCache.setCache
        }
      })
      return balancesResponse[addressC]?.[network.networkToken.symbol]
    }
  })
}
