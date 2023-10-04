import { useQuery } from '@tanstack/react-query'
import { Zodios } from '@zodios/core'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { ExchangeRateSchema } from 'services/defi/types'

// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.min.json'

const apiClient = new Zodios(CURRENCY_EXCHANGE_RATES_URL, [
  {
    method: 'get',
    path: '',
    alias: 'getExchangeRates',
    response: ExchangeRateSchema
  }
])

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useExchangeRates = () => {
  return useQuery({
    queryKey: [ReactQueryKeys.DEFI_EXCHANGE_RATES],
    queryFn: () => apiClient.getExchangeRates()
  })
}
