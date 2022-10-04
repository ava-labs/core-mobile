import { Network } from '@avalabs/chains-sdk'
import { TokenType } from 'store/balance'
import {
  SimplePriceResponse,
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import tokenService from 'services/token/TokenService'
import { MarketToken } from 'store/watchlist'

// .B for Bitcoin, .E for Ethereum
const bridgedTokenRegexp = /\.[BE]$/

class WatchlistService {
  async getMarketData(
    currencyStr: string,
    networks: Network[]
  ): Promise<MarketToken[]> {
    const currency = currencyStr.toLowerCase() as VsCurrencyType
    const allTokens: { [symbol: string]: MarketToken } = {}

    const marketTokens = await tokenService.getTopTokenMarket(currency)
    const marketTokenIds: string[] = []

    marketTokens.forEach(mt => {
      const symbol = mt.symbol.toUpperCase()
      allTokens[symbol] = {
        id: mt.id,
        name: mt.name,
        symbol,
        logoUri: mt.image,
        type: TokenType.NATIVE,
        priceInCurrency: mt.price,
        assetPlatformId: '',
        change24: 0,
        marketCap: 0,
        vol24: 0
      }
      marketTokenIds.push(mt.id)
    })

    networks.forEach(({ tokens, pricingProviders }) => {
      tokens?.forEach(tk => {
        const symbol = tk.symbol.toUpperCase()
        if (
          // Ignore if already added by marketTokens
          allTokens[symbol] ||
          // Ignore Avalanche bridged tokens
          allTokens[symbol.replace(bridgedTokenRegexp, '')]
        ) {
          return
        }
        allTokens[symbol] = {
          id: tk.address,
          name: tk.name,
          symbol,
          logoUri: tk.logoUri || '',
          type: TokenType.ERC20,
          assetPlatformId: pricingProviders?.coingecko.assetPlatformId || '',
          priceInCurrency: 0,
          change24: 0,
          marketCap: 0,
          vol24: 0
        }
      })
    })

    const promises: Promise<SimplePriceResponse | undefined>[] = []
    promises.push(
      tokenService.fetchPriceWithMarketData(marketTokenIds, currency)
    )

    for (const nt of networks) {
      const assetPlatformId =
        nt.pricingProviders?.coingecko?.assetPlatformId ?? ''
      const tokenAddresses =
        nt?.tokens?.map(token => token.address.toLowerCase()) ?? []
      if (tokenAddresses.length > 0) {
        promises.push(
          tokenService.getPricesWithMarketDataByAddresses(
            tokenAddresses,
            assetPlatformId,
            currency.toLowerCase() as VsCurrencyType
          )
        )
      }
    }

    const tokenPriceDict:
      | SimpleTokenPriceResponse
      | SimplePriceResponse
      | undefined = (await Promise.allSettled(promises)).reduce(
      (prev, result) => {
        return result.status === 'fulfilled'
          ? { ...prev, ...result.value }
          : prev
      },
      {}
    )

    const data =
      Object.values(allTokens).map((token: MarketToken) => {
        const tokenPrice =
          tokenPriceDict[token.id.toLowerCase()]?.[currency as VsCurrencyType]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

        return {
          ...token,
          coingeckoId: token.type === TokenType.NATIVE && token.id,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as MarketToken
      }) ?? []

    return data
  }

  async tokenSearch(query: string) {
    const coins = await tokenService.getTokenSearch(query)
    if (coins) {
      const ids = coins.map((tk: MarketToken) => tk.id)
      const prices = await tokenService.fetchPriceWithMarketData(
        ids,
        'usd' as VsCurrencyType
      )

      return coins.map(coin => {
        const tokenPrice =
          prices?.[coin.id.toLowerCase()]?.['usd' as VsCurrencyType]
        const priceUSD = tokenPrice?.price ?? 0
        const marketCap = tokenPrice?.marketCap ?? 0
        const change24 = tokenPrice?.change24 ?? 0
        const vol24 = tokenPrice?.vol24 ?? 0

        return {
          ...coin,
          coingeckoId: coin.id,
          type: TokenType.NATIVE,
          priceInCurrency: priceUSD,
          marketCap,
          change24,
          vol24
        } as MarketToken
      })
    }
    return []
  }
}

export default new WatchlistService()
