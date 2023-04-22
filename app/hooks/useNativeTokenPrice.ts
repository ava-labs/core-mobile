import { useEffect, useState } from 'react'
import { from, timer } from 'rxjs'
import { concatMap } from 'rxjs/operators'
import { getInstance } from 'services/token/TokenService'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectSelectedCurrency } from 'store/settings/currency'

export function useNativeTokenPrice(customCurrency?: VsCurrencyType) {
  const [nativeTokenPrice, setNativeTokenPrice] = useState(0)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency) as VsCurrencyType
  const currency = customCurrency ?? (selectedCurrency as VsCurrencyType)

  useEffect(refreshPriceFx, [
    activeNetwork.pricingProviders?.coingecko.nativeTokenId,
    currency
  ])

  function refreshPriceFx() {
    const tokenService = getInstance()

    const TEN_SECONDS = 10000
    const subscription = timer(0, TEN_SECONDS)
      .pipe(
        concatMap(() => {
          return from(
            tokenService.getPriceWithMarketDataByCoinId(
              activeNetwork.pricingProviders?.coingecko.nativeTokenId ?? '',
              currency
            )
          )
        })
      )
      .subscribe({
        next: value => {
          setNativeTokenPrice(value.price)
        }
      })
    return () => subscription.unsubscribe()
  }

  return {
    nativeTokenPrice
  }
}
