import { TokenType, TokenWithBalance } from 'store/balance'
import tokenService from 'services/balance/TokenService'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useEffect, useState } from 'react'
import { Network } from '@avalabs/chains-sdk'

type Props = {
  network: Network
  token: TokenWithBalance | undefined
  currency: VsCurrencyType
}

export function useTokenPriceInCurrency({ network, token, currency }: Props) {
  const [tokenPriceInSelectedCurrency, setTokenPriceInSelectedCurrency] =
    useState(0.0)

  useEffect(fetchPriceInSelectedCurrencyFx, [
    network.pricingProviders?.coingecko?.assetPlatformId,
    currency,
    token
  ])

  function fetchPriceInSelectedCurrencyFx() {
    if (token && token.type === TokenType.NATIVE) {
      tokenService
        .getPriceWithMarketDataByCoinId(token.coingeckoId, currency)
        .then(value => setTokenPriceInSelectedCurrency(value.price))
    } else if (token && token.type === TokenType.ERC20) {
      const assetPlatformId =
        network.pricingProviders?.coingecko?.assetPlatformId ?? ''
      tokenService
        .getPricesWithMarketDataByAddresses(
          [token.address],
          assetPlatformId,
          currency
        )
        .then(value => {
          const price = value?.[token.address.toLowerCase()]?.[currency]?.price
          if (price) {
            setTokenPriceInSelectedCurrency(price)
          }
        })
    }
  }

  return {
    tokenPriceInSelectedCurrency
  }
}
