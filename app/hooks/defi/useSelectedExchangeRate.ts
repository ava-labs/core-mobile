import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useExchangeRates } from './useExchangeRates'

export const useSelectedExchangeRate = () => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()

  const exchangeRate = useMemo(() => {
    return data?.usd?.[selectedCurrency.toLowerCase()]
  }, [data?.usd, selectedCurrency])

  return exchangeRate
}
