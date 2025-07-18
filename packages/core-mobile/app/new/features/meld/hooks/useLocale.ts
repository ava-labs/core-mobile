import { useLocales } from 'expo-localization'
import { useSelector } from 'react-redux'
import { CurrencySymbol, selectSelectedCurrency } from 'store/settings/currency'

export const useLocale = (): {
  currencyCode: CurrencySymbol
  countryCode: string
} => {
  const locales = useLocales()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const countryCode = locales[0]?.regionCode?.toUpperCase() ?? 'US'

  return {
    currencyCode: selectedCurrency,
    countryCode
  }
}
