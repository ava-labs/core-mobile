import { LocalTokenWithBalance } from 'store/balance'
import { useCallback } from 'react'
import { ServiceProviderCategories } from '../consts'
import { isBtcToken, isSupportedToken, isSupportedNativeToken } from '../utils'
import { CryptoCurrency } from '../types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'

export const useGetBuyableCryptoCurrency = (): {
  getBuyableCryptoCurrency: (
    tokenOrAddress: LocalTokenWithBalance | string
  ) => CryptoCurrency | undefined
} => {
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })

  const getBuyableCryptoCurrency = useCallback(
    (tokenOrAddress: LocalTokenWithBalance | string) => {
      if (!tokenOrAddress || !cryptoCurrencies) {
        return undefined
      }

      if (typeof tokenOrAddress === 'string') {
        return cryptoCurrencies.find(
          crypto => crypto.contractAddress === tokenOrAddress
        )
      }
      return cryptoCurrencies.find(crypto => {
        return (
          isSupportedNativeToken(crypto, tokenOrAddress) ||
          isSupportedToken(crypto, tokenOrAddress) ||
          isBtcToken(crypto, tokenOrAddress)
        )
      })
    },
    [cryptoCurrencies]
  )
  return { getBuyableCryptoCurrency }
}
