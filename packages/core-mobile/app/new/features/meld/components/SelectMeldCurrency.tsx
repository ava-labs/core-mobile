import { SelectCurrency } from 'features/accountSettings/components/SelectCurrency'
import React, { useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import {
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
  const { data: currencies, isLoading } = useSearchFiatCurrencies({
    categories: [category]
  })

  const sortedCurrencies = useMemo(() => {
    if (currencies === undefined) {
      return []
    }
    const usCurrency = currencies.filter(
      currency => currency.currencyCode === CurrencySymbol.USD
    )

    const otherCurrencies = currencies.filter(
      currency => currency.currencyCode !== CurrencySymbol.USD
    )

    const sortedOtherCurrencies = otherCurrencies.toSorted((a, b) => {
      return a.name?.localeCompare(b.name ?? '') ?? 0
    })
    return [...usCurrency, ...sortedOtherCurrencies]
  }, [currencies])

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
