import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  currencies,
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import { CurrencyIcon } from 'common/components/CurrencyIcon'
import { SelectCurrency } from '../components/SelectCurrency'

export const SelectCurrencyScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const currenciesWithLogoUrl = useMemo(() => {
    return currencies.map(currency => ({
      name: currency.name,
      symbol: currency.symbol,
      logoUrl: <CurrencyIcon symbol={currency.symbol} />
    }))
  }, [])

  return (
    <SelectCurrency
      currencies={currenciesWithLogoUrl}
      selectedCurrency={selectedCurrency}
      setSelectedCurrency={symbol => dispatch(setSelectedCurrency(symbol))}
    />
  )
}
