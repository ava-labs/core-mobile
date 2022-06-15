import { useEffect, useState } from 'react'
import { from, timer } from 'rxjs'
import { concatMap } from 'rxjs/operators'
import tokenService from 'services/balance/TokenService'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export function useNativeTokenPrice() {
  const [nativeTokenPrice, setNativeTokenPrice] = useState(0)
  const activeNetwork = useSelector(selectActiveNetwork)

  useEffect(refreshPriceFx, [
    activeNetwork.pricingProviders?.coingecko.nativeTokenId
  ])

  function refreshPriceFx() {
    const TEN_SECONDS = 10000
    const subscription = timer(0, TEN_SECONDS)
      .pipe(
        concatMap(() => {
          return from(
            tokenService.getPriceWithMarketDataByCoinId(
              activeNetwork.pricingProviders?.coingecko.nativeTokenId ?? '',
              VsCurrencyType.USD
            )
          )
        })
      )
      .subscribe({
        next: value => setNativeTokenPrice(value.price)
      })
    return () => subscription.unsubscribe()
  }

  return {
    nativeTokenPrice
  }
}
