import { useQuery } from '@tanstack/react-query'
import DeFiService from 'services/defi/DeFiService'

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ['exchangeRates'],
    queryFn: () => DeFiService.getExchangeRates()
  })
}
