import { useEffect, useState } from 'react'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import Big from 'big.js'
import TokenService from 'services/token/TokenService'
import Logger from 'utils/Logger'

export const useSimplePrice = (
  coinId: string | undefined,
  currency: VsCurrencyType
): Big | undefined => {
  const [price, setPrice] = useState<Big>()

  useEffect(() => {
    if (!coinId) {
      setPrice(undefined)
      return
    }

    TokenService.getSimplePrice({
      coinIds: [coinId],
      currency: currency.toLowerCase() as VsCurrencyType
    })
      .then(data => {
        const value = new Big(data?.[coinId]?.[currency]?.price || 0)
        setPrice(value)
      })
      .catch(Logger.error)
  }, [coinId, currency])

  return price
}
