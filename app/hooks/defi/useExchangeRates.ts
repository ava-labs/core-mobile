import { useQuery } from '@tanstack/react-query'
import { initClient, initContract } from '@ts-rest/core'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { ExchangeRateSchema } from 'services/defi/types'

// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.min.json'

const c = initContract()

const contract = c.router(
  {
    getExchangeRates: {
      method: 'GET',
      path: '',
      responses: {
        200: ExchangeRateSchema
      }
    }
  },
  {
    strictStatusCodes: true
  }
)

export const exchangeRatesClient = initClient(contract, {
  baseUrl: CURRENCY_EXCHANGE_RATES_URL,
  baseHeaders: {}
})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useExchangeRates = () => {
  return useQuery({
    queryKey: [ReactQueryKeys.DEFI_EXCHANGE_RATES],
    queryFn: () => exchangeRatesClient.getExchangeRates()
  })
}
