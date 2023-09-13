import { useQuery } from '@tanstack/react-query'
import { REACT_QUERY_KEYS } from 'consts/reactQueryKeys'
import DeFiService from 'services/defi/DeFiService'

export const useExchangeRates = () => {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.DEFI_EXCHANGE_RATES],
    queryFn: () => DeFiService.getExchangeRates()
  })
}
