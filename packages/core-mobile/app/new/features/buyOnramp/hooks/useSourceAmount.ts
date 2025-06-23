import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useMemo } from 'react'
import { ServiceProviderCategories } from '../consts'
import { useOnRampSourceAmount, useOnRampToken } from '../store'
import { useGetPurchaseLimits } from './useGetPurchaseLimits'

export const useSourceAmount = (): {
  sourceAmount: number | undefined
  setSourceAmount: (amount: number) => void
  isAboveMinimumPurchaseLimit: boolean
  isBelowMaximumPurchaseLimit: boolean
  minimumPurchaseLimit: number | undefined
  maximumPurchaseLimit: number | undefined
  isLoadingPurchaseLimits: boolean
  hasValidSourceAmount: boolean
} => {
  const [sourceAmount, setSourceAmount] = useOnRampSourceAmount()
  const [onrampToken] = useOnRampToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const { data: purchaseLimits, isLoading: isLoadingPurchaseLimits } =
    useGetPurchaseLimits({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP],
      fiatCurrencies: [selectedCurrency],
      cryptoCurrencyCodes: onrampToken?.currencyCode
        ? [onrampToken?.currencyCode]
        : undefined
    })

  const selectedPurchasingFiatCurrency = useMemo(() => {
    return purchaseLimits?.find(
      limit => limit.currencyCode === selectedCurrency
    )
  }, [purchaseLimits, selectedCurrency])

  const minimumPurchaseLimit =
    selectedPurchasingFiatCurrency?.minimumAmount ?? undefined
  const maximumPurchaseLimit =
    selectedPurchasingFiatCurrency?.maximumAmount ?? undefined

  const isAboveMinimumPurchaseLimit = useMemo(() => {
    if (!selectedPurchasingFiatCurrency) {
      // if there is no matching fiat currency found, we don't allow the user to proceed
      return false
    }

    return (
      (sourceAmount ?? 0) >=
      (selectedPurchasingFiatCurrency?.minimumAmount ?? 0)
    )
  }, [selectedPurchasingFiatCurrency, sourceAmount])

  const isBelowMaximumPurchaseLimit = useMemo(() => {
    if (!selectedPurchasingFiatCurrency) {
      // if there is no matching fiat currency found, we don't allow the user to proceed
      return false
    }

    return (
      (sourceAmount ?? 0) <=
      (selectedPurchasingFiatCurrency?.maximumAmount ?? 0)
    )
  }, [selectedPurchasingFiatCurrency, sourceAmount])

  const hasValidSourceAmount = useMemo(() => {
    return (
      sourceAmount !== undefined &&
      sourceAmount !== 0 &&
      isAboveMinimumPurchaseLimit &&
      isBelowMaximumPurchaseLimit
    )
  }, [sourceAmount, isAboveMinimumPurchaseLimit, isBelowMaximumPurchaseLimit])

  return {
    sourceAmount,
    setSourceAmount,
    hasValidSourceAmount,
    isAboveMinimumPurchaseLimit,
    isBelowMaximumPurchaseLimit,
    minimumPurchaseLimit,
    maximumPurchaseLimit,
    isLoadingPurchaseLimits
  }
}
