import { useEffect, useState } from 'react'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import Big from 'big.js'
import TokenService from 'services/token/TokenService'
import Logger from 'utils/Logger'

const BIG_ZERO = new Big(0)

export const useSimplePrice = (
  coinId: string | undefined,
  currency: VsCurrencyType
): Big => {
  const [price, setPrice] = useState<Big>(BIG_ZERO)

  useEffect(() => {
    if (!coinId) return

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
