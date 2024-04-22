import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { refetchIntervals } from 'consts/earn'
import NetworkService from 'services/network/NetworkService'
import { selectSelectedCurrency } from 'store/settings/currency'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const usePChainBalance = () => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: !!addressPVM,
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM, selectedCurrency],
    queryFn: async () =>
      GlacierBalanceService.getPChainBalance({
        network: NetworkService.getAvalancheNetworkP(isDeveloperMode),
        addresses: addressPVM ? [addressPVM] : [],
        currency: selectedCurrency
      })
  })
}
