import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'

export const useIsAvaxCSupported = (): boolean => {
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  return !!cryptoCurrencies?.some(
    crypto => crypto.currencyCode === MELD_CURRENCY_CODES.AVAXC
  )
}
