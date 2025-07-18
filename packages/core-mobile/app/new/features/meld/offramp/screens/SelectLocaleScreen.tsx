import React, { useLayoutEffect, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useMeldCountryCode, useMeldToken } from 'features/meld/store'
import { useLocale } from 'features/meld/hooks/useLocale'
import { SelectLocale } from 'features/meld/components/SelectLocale'
import { useSearchCountries } from 'features/meld/hooks/useSearchCountries'
import { useSearchFiatCurrencies } from 'features/meld/hooks/useSearchFiatCurrencies'
import { ServiceProviderCategories } from 'features/meld/consts'

export const SelectLocaleScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [meldToken] = useMeldToken()
  const { currencyCode, countryCode } = useLocale()
  const [selectedCountryCode, setSelectedCountryCode] = useMeldCountryCode()
  const { data: countries, isLoading: isLoadingCountries } = useSearchCountries(
    {
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    }
  )
  const { data: meldCurrencies, isLoading: isLoadingCurrencies } =
    useSearchFiatCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })

  useLayoutEffect(() => {
    selectedCountryCode === undefined && setSelectedCountryCode(countryCode)
  }, [selectedCountryCode, countryCode, setSelectedCountryCode])

  const handleOnNext = (): void => {
    if (meldToken) {
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/offramp/selectWithdrawAmount')
    } else {
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/offramp/selectToken')
    }
  }

  const handleOnSelectCountry = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframpCountry')
  }

  const handleOnSelectCurrency = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframpCurrency')
  }

  const selectedCountry = useMemo(() => {
    return countries?.find(c => c.countryCode === selectedCountryCode)
  }, [countries, selectedCountryCode])

  const selectedCurrency = useMemo(() => {
    return meldCurrencies?.find(c => c.currencyCode === currencyCode)
  }, [meldCurrencies, currencyCode])

  return (
    <SelectLocale
      isLoadingCountry={isLoadingCountries}
      isLoadingCurrency={isLoadingCurrencies}
      selectedCountry={selectedCountry}
      selectedCurrency={selectedCurrency}
      onNext={handleOnNext}
      onSelectCountry={handleOnSelectCountry}
      onSelectCurrency={handleOnSelectCurrency}
    />
  )
}
