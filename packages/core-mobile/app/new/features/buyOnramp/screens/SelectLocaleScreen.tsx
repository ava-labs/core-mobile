import React, { useLayoutEffect } from 'react'
import { useRouter } from 'expo-router'
import { SelectLocale } from '../components/SelectLocale'
import { useLocale } from '../hooks/useLocale'
import { useOnRampCountryCode, useOnRampCurrencyCode } from '../store'

export const SelectLocaleScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { currencyCode, countryCode } = useLocale()
  const [selectedCountryCode, setSelectedCountryCode] = useOnRampCountryCode()
  const [selectedCurrencyCode, setSelectedCurrencyCode] =
    useOnRampCurrencyCode()

  useLayoutEffect(() => {
    setSelectedCountryCode(undefined)
    setSelectedCurrencyCode(undefined)
  }, [
    countryCode,
    currencyCode,
    setSelectedCountryCode,
    setSelectedCurrencyCode
  ])

  const handleOnNext = (): void => {
    // Handle the next action, e.g., navigate to the next screen
  }

  const handleOnSelectCountry = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectCountry')
  }

  const handleOnSelectCurrency = (): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectCurrency')
  }

  return (
    <SelectLocale
      selectedCountryCode={selectedCountryCode ?? countryCode}
      currencyCode={
        selectedCurrencyCode?.toUpperCase() ?? currencyCode?.toUpperCase()
      }
      onNext={handleOnNext}
      onSelectCountry={handleOnSelectCountry}
      onSelectCurrency={handleOnSelectCurrency}
    />
  )
}
