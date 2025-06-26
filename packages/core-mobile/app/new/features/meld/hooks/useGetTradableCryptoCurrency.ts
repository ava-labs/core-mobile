import { LocalTokenWithBalance } from 'store/balance'
import { useCallback } from 'react'
import { ServiceProviderCategories } from '../consts'
import { isTokenTradable } from '../utils'
import { CryptoCurrency } from '../types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'

export const useGetTradableCryptoCurrency = (): {
  getTradableCryptoCurrency: (
    token?: LocalTokenWithBalance,
    address?: string
  ) => CryptoCurrency | undefined
} => {
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })

  const getTradableCryptoCurrency = useCallback(
    (token?: LocalTokenWithBalance, address?: string) => {
      if ((!token && !address) || !cryptoCurrencies) {
        return undefined
      }

      if (address) {
        return cryptoCurrencies.find(
          crypto => crypto.contractAddress === address
        )
      }

      if (token) {
        return cryptoCurrencies.find(crypto => {
          return isTokenTradable(crypto, token)
        })
      }
    },
    [cryptoCurrencies]
  )
  return { getTradableCryptoCurrency }
}
