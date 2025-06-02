import { SelectCurrency } from 'features/accountSettings/components/SelectCurrency'
import React from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useOnRampCurrencyCode } from '../store'
import { useSearchFiatCurrencies } from '../hooks/useSearchFiatCurrencies'

export const SelectCurrencyScreen = (): React.JSX.Element => {
  const [selectedCurrency, setSelectedCurrency] = useOnRampCurrencyCode()
  const { data: currencies, isLoading } = useSearchFiatCurrencies()

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  if (currencies === undefined) {
    return <ErrorState sx={{ flex: 1 }} />
  }

  return (
    <SelectCurrency
      currencies={currencies.map(curr => {
        return {
          name: curr.name,
          symbol: curr.currencyCode.toUpperCase(),
          logoUrl: curr.symbolImageUrl
        }
      })}
      selectedCurrency={selectedCurrency}
      setSelectedCurrency={setSelectedCurrency}
    />
  )
}
