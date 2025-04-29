import { useEffect, useState } from 'react'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import TokenService from 'services/token/TokenService'
import Logger from 'utils/Logger'
import { Prices } from 'features/bridge/hooks/useBridge'

export const useSimplePrices = (
  coinIds: string[],
  currency: VsCurrencyType
): Prices | undefined => {
  const [prices, setPrices] = useState<Prices>()

  useEffect(() => {
    if (coinIds.length === 0) {
      setPrices(undefined)
      return
    }

    TokenService.getSimplePrice({
      coinIds,
      currency: currency.toLowerCase() as VsCurrencyType
    })
      .then(data => {
        if (data === undefined) {
          setPrices(undefined)
          return
        }
        const pricesByCoinIds = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            value[currency]?.price ?? undefined
          ])
        )
        setPrices(pricesByCoinIds)
      })
      .catch(Logger.error)
  }, [coinIds, currency])

  return prices
}
