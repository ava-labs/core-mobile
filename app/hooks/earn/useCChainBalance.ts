import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'

const POLLING_INTERVAL = 10000 // 10 seconds

export const useCChainBalance = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useQuery({
    refetchInterval: POLLING_INTERVAL,
    enabled: Boolean(addressC),
    queryKey: ['cChainBalance', isDeveloperMode, addressC, selectedCurrency],
    queryFn: async () =>
      GlacierBalanceService.getCChainBalance(
        isDeveloperMode,
        addressC,
        selectedCurrency
      )
  })
}
