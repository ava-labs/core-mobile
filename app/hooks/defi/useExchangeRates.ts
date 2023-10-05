import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import DeFiService from 'services/defi/DeFiService'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useExchangeRates = () => {
  return useQuery({
    queryKey: [ReactQueryKeys.DEFI_EXCHANGE_RATES],
    queryFn: () => DeFiService.getExchangeRates()
  })
}
