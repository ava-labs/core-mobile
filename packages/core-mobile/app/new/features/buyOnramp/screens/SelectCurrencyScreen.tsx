import { SelectCurrency } from 'features/accountSettings/components/SelectCurrency'
import React, { useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { CurrencySymbol } from 'store/settings/currency'
import { useOnRampCurrencyCode } from '../store'
import { useSearchFiatCurrencies } from '../hooks/useSearchFiatCurrencies'

export const SelectCurrencyScreen = (): React.JSX.Element => {
  const [selectedCurrency, setSelectedCurrency] = useOnRampCurrencyCode()
  const { data: currencies, isLoading } = useSearchFiatCurrencies()

  const sortedCurrencies = useMemo(() => {
    if (currencies === undefined) {
      return []
    }
    const usCurrency = currencies.filter(
      currency => currency.currencyCode === CurrencySymbol.USD
    )
    const otherCurrencies = currencies.toSorted((a, b) => {
      return a.name.localeCompare(b.name)
    })
    return [...usCurrency, ...otherCurrencies]
  }, [currencies])

  const transformedCurrencies = useMemo(() => {
    return sortedCurrencies.map(curr => {
      return {
        name: curr.name,
        symbol: curr.currencyCode.toUpperCase(),
        logoUrl: curr.symbolImageUrl
      }
    })
  }, [sortedCurrencies])

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
      setSelectedCurrency={setSelectedCurrency}
    />
  )
}
