import React, { useLayoutEffect } from 'react'
import { useRouter } from 'expo-router'
import { useMeldCountryCode, useMeldToken } from 'features/meld/store'
import { useLocale } from 'features/meld/hooks/useLocale'
import { SelectLocale } from 'features/meld/components/SelectLocale'
import { useSearchCountries } from 'features/meld/hooks/useSearchCountries'
import { useSearchFiatCurrencies } from 'features/meld/hooks/useSearchFiatCurrencies'
import { ServiceProviderCategories } from 'features/meld/consts'
import { useDispatch } from 'react-redux'
import { setSelectedCurrency } from 'store/settings/currency'

export const SelectLocaleScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [meldToken] = useMeldToken()
  const { currencyCode, countryCode } = useLocale()
  const [selectedCountryCode, setSelectedCountryCode] = useMeldCountryCode()
  const dispatch = useDispatch()
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
    setSelectedCountryCode(countryCode)
  }, [countryCode, currencyCode, dispatch, setSelectedCountryCode])

  const handleOnNext = (): void => {
    dispatch(setSelectedCurrency(currencyCode))
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

  const selectedCountry = countries?.find(
    c => c.countryCode === (selectedCountryCode ?? countryCode)
  )

  const selectedCurrency = meldCurrencies?.find(
    c => c.currencyCode === currencyCode
  )

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
