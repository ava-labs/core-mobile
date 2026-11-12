import { getLocales, Locale, useLocales } from 'expo-localization'
import { useSelector } from 'react-redux'
import { CurrencySymbol, selectSelectedCurrency } from 'store/settings/currency'

const toCountryCode = (locales: Locale[]): string =>
  locales[0]?.regionCode?.toUpperCase() ?? 'US'

export const getDeviceCountryCode = (): string => toCountryCode(getLocales())

export const useLocale = (): {
  currencyCode: CurrencySymbol
  countryCode: string
} => {
  const locales = useLocales()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const countryCode = toCountryCode(locales)

  return {
    currencyCode: selectedCurrency,
    countryCode
  }
}
