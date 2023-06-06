import { useEffect, useState } from 'react'
import { from, timer } from 'rxjs'
import { concatMap } from 'rxjs/operators'
import { getInstance } from 'services/token/TokenService'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Network } from '@avalabs/chains-sdk'

export function useNativeTokenPriceForNetwork(
  network: Network | undefined,
  customCurrency?: VsCurrencyType
) {
  const [nativeTokenPrice, setNativeTokenPrice] = useState(0)
  const selectedCurrency = useSelector(selectSelectedCurrency) as VsCurrencyType
  const currency = customCurrency ?? (selectedCurrency as VsCurrencyType)

  useEffect(refreshPriceFx, [
    network?.pricingProviders?.coingecko.nativeTokenId,
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
              network?.pricingProviders?.coingecko.nativeTokenId ?? '',
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
