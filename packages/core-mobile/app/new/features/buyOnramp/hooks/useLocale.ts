import { useLocales } from 'expo-localization'

export const useLocale = (): { currencyCode?: string; countryCode: string } => {
  const locales = useLocales()

  const currencyCode = locales[0]?.currencyCode?.toUpperCase() ?? 'USD'
  const countryCode = locales[0]?.regionCode?.toUpperCase() ?? 'United States'

  return {
    currencyCode,
    countryCode
  }
}
