import { useLocales } from 'expo-localization'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

export const useLocale = (): { currencyCode?: string; countryCode: string } => {
  const locales = useLocales()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const countryCode = locales[0]?.regionCode?.toUpperCase() ?? 'United States'

  return {
    currencyCode: selectedCurrency,
    countryCode
  }
}
