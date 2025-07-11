import React, { useLayoutEffect, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useMeldCountryCode, useMeldToken } from 'features/meld/store'
import { useLocale } from 'features/meld/hooks/useLocale'
import { SelectLocale } from 'features/meld/components/SelectLocale'
import { useSearchCountries } from 'features/meld/hooks/useSearchCountries'
import { useSearchFiatCurrencies } from 'features/meld/hooks/useSearchFiatCurrencies'
import { ServiceProviderCategories } from 'features/meld/consts'
import { useDispatch } from 'react-redux'
import { currencies } from 'store/settings/currency'

export const SelectLocaleScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [meldToken] = useMeldToken()
  const { currencyCode, countryCode } = useLocale()
  const [selectedCountryCode, setSelectedCountryCode] = useMeldCountryCode()
  const dispatch = useDispatch()
  const { data: countries } = useSearchCountries({
    categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
  })
  const { data: meldCurrencies, isLoading: isLoadingCurrencies } =
    useSearchFiatCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })

  const supportedCurrencyCodes = currencies.map(currency =>
    currency.symbol.toUpperCase()
  )

  const supportedCurrencies = useMemo(() => {
    return (
      meldCurrencies?.filter(
        currency =>
          currency.currencyCode &&
          supportedCurrencyCodes.includes(currency.currencyCode)
      ) ?? []
    )
  }, [meldCurrencies, supportedCurrencyCodes])

  useLayoutEffect(() => {
    setSelectedCountryCode(countryCode)
  }, [countryCode, currencyCode, dispatch, setSelectedCountryCode])

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

  return (
    <SelectLocale
      countries={countries ?? []}
      currencies={supportedCurrencies}
      isLoadingCurrencies={isLoadingCurrencies}
      selectedCountryCode={selectedCountryCode}
      currencyCode={currencyCode?.toUpperCase()}
      onNext={handleOnNext}
      onSelectCountry={handleOnSelectCountry}
      onSelectCurrency={handleOnSelectCurrency}
    />
  )
}
