import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { refetchIntervals } from 'consts/earn'

export const useCChainBalance = () => {
  const addressC = useSelector(selectActiveAccount)?.address ?? ''
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
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
