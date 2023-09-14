import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import DeFiService from 'services/defi/DeFiService'

export const useExchangeRates = () => {
  return useQuery({
    queryKey: [ReactQueryKeys.DEFI_EXCHANGE_RATES],
    queryFn: () => DeFiService.getExchangeRates()
  })
}
