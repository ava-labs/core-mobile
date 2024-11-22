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
import Logger from 'utils/Logger'
import { isDevnet } from 'utils/isDevnet'
import { selectActiveNetwork } from 'store/network'

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
      const balancesResponse = await ModuleManager.avalancheModule.getBalances({
        addresses: [addressPVM],
        currency: selectedCurrency,
        network: mapToVmNetwork(network),
        storage: coingeckoInMemoryCache
      })

      const pChainBalanceResponse = balancesResponse[addressPVM]
      if (!pChainBalanceResponse || 'error' in pChainBalanceResponse) {
        Logger.error(
          'Failed to fetch p-chain balance',
          pChainBalanceResponse?.error
        )
        return
      }
      const pChainBalance = pChainBalanceResponse[network.networkToken.symbol]

      if (
        pChainBalance === undefined ||
        'error' in pChainBalance ||
        !isTokenWithBalancePVM(pChainBalance)
      ) {
        return
      }
      return pChainBalance
    }
  })
}
