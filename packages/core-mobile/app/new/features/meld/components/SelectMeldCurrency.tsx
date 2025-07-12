import { SelectCurrency } from 'features/accountSettings/components/SelectCurrency'
import React, { useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import {
  currencies,
  CurrencySymbol,
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchFiatCurrencies } from '../hooks/useSearchFiatCurrencies'
import { ServiceProviderCategories } from '../consts'

export const SelectMeldCurrency = ({
  category
}: {
  category: ServiceProviderCategories
}): React.JSX.Element => {
  const dispatch = useDispatch()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data: meldCurrencies, isLoading } = useSearchFiatCurrencies({
    categories: [category]
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

  const sortedCurrencies = useMemo(() => {
    if (supportedCurrencies === undefined) {
      return []
    }
    const usCurrency = supportedCurrencies.filter(
      currency => currency.currencyCode === CurrencySymbol.USD
    )

    const otherCurrencies = supportedCurrencies.filter(
      currency => currency.currencyCode !== CurrencySymbol.USD
    )

    const sortedOtherCurrencies = otherCurrencies.toSorted((a, b) => {
      return a.name?.localeCompare(b.name ?? '') ?? 0
    })
    return [...usCurrency, ...sortedOtherCurrencies]
  }, [supportedCurrencies])

  const transformedCurrencies = useMemo(() => {
    return sortedCurrencies.map(curr => {
      return {
        name: curr.name ?? '',
        symbol: curr.currencyCode?.toUpperCase() ?? '',
        logoUrl: curr.symbolImageUrl
      }
    })
  }, [sortedCurrencies])

  const handleOnSelectCurrency = (currency: CurrencySymbol): void => {
    dispatch(setSelectedCurrency(currency))
  }

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  if (currencies === undefined) {
    return <ErrorState sx={{ flex: 1 }} />
  }

  return (
    <SelectCurrency
      currencies={transformedCurrencies}
      selectedCurrency={selectedCurrency}
      setSelectedCurrency={handleOnSelectCurrency}
    />
  )
}
