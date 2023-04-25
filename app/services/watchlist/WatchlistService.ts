import { ChainId, Network } from '@avalabs/chains-sdk'
import { CoinMarket, VsCurrencyType } from '@avalabs/coingecko-sdk'
import { getBasicInstance, getInstance } from 'services/token/TokenService'
import { transformSparklineData } from 'services/token/utils'
import { Charts, MarketToken, Prices } from 'store/watchlist'

const coinByAddress = require('assets/coinByAddress.json')

const notFoundId = -1

const getMarketsCommonParams = {
  sparkline: true,
  perPage: 250,
  page: 1
}

const getCoingeckoId = (address: string, symbol: string) => {
  if (coinByAddress[address] && coinByAddress[address].symbol === symbol) {
    return coinByAddress[address].id
  }

  return notFoundId
}

class WatchlistService {
  async getTokens(
    currency: string,
    allNetworks: Network[],
    cachedFavoriteTokenIds: string[]
  ): Promise<{
    tokens: Record<string, MarketToken>
    charts: Charts
  }> {
    // 1. get top 250 tokens with sparkline data
    const dynamicTokenService = getInstance()
    const top250Tokens = await dynamicTokenService.getMarkets({
      currency: currency.toLowerCase() as VsCurrencyType,
      ...getMarketsCommonParams
    })

    // 2. get all network contract tokens + favorite tokens with sparkline data
    const top250TokenIds = top250Tokens.map(token => token.id)

    const tokenIdsToFetch: string[] = []

    allNetworks.forEach(({ chainId, tokens }) => {
      if (chainId === ChainId.ETHEREUM_HOMESTEAD) {
        // skipping ethereum network's tokens since it has over 4k tokens
        return
      }

      tokens?.forEach(tk => {
        const symbol = tk.symbol.toUpperCase()

        if (
          // Ignore Avalanche bridged tokens
          // .B for Bitcoin, .E for Ethereum
          symbol.includes('.B') ||
          symbol.includes('.E')
        ) {
          return
        }

        const coingeckoId = getCoingeckoId(
          tk.address.toLowerCase(),
          tk.symbol.toLowerCase()
        )

        if (
          coingeckoId === notFoundId ||
          top250TokenIds.includes(coingeckoId) ||
          tokenIdsToFetch.includes(coingeckoId)
        ) {
          // uncomment to log tokens that are not available on coingecko
          // coingeckoId === notFoundId &&
          //   Logger.info(
          //     'could not find a coingecko id for token',
          //     `address: ${tk.address} - symbol: ${tk.symbol}`
          //   )

          // ignore if we can't find a coingecko id
          // or if already included in the top 100
          // of if already included (due to duplicate tokens)
          return
        }

        tokenIdsToFetch.push(coingeckoId)
      })
    })

    tokenIdsToFetch.push(...cachedFavoriteTokenIds)

    let otherTokens: CoinMarket[] = []

    if (tokenIdsToFetch.length !== 0) {
      // network contract tokens and favorite tokens
      otherTokens = await dynamicTokenService.getMarkets({
        currency: currency as VsCurrencyType,
        coinIds: tokenIdsToFetch,
        ...getMarketsCommonParams
      })
    }

    const tokens: Record<string, MarketToken> = {}
    const charts: Charts = {}

    // 3. combine 1 and 2 and extract tokens and charts data
    top250Tokens.concat(otherTokens).forEach(token => {
      const tokenToAdd = {
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        logoUri: token.image
      }

      tokens[token.id] = tokenToAdd

      charts[token.id] = transformSparklineData(token.sparkline_in_7d.price)
    })

    return { tokens, charts }
  }

  async getPrices(coingeckoIds: string[], currency: string): Promise<Prices> {
    const dynamicTokenService = getInstance()

    const pricesRaw = await dynamicTokenService.getPriceWithMarketDataByCoinIds(
      coingeckoIds,
      currency as VsCurrencyType
    )

    const prices: Prices = {}

    for (const tokenId in pricesRaw) {
      const pricesInCurrency = pricesRaw[tokenId]
      if (!pricesInCurrency) continue
      const price = pricesInCurrency[currency as VsCurrencyType]
      prices[tokenId] = {
        priceInCurrency: price?.price ?? 0,
        change24: price?.change24 ?? 0,
        marketCap: price?.marketCap ?? 0,
        vol24: price?.vol24 ?? 0
      }
    }

    return prices
  }

  async tokenSearch(
    query: string,
    currency: string
  ): Promise<
    { tokens: MarketToken[]; charts: Charts; prices: Prices } | undefined
  > {
    const tokenService = getBasicInstance()
    const coins = await tokenService.getTokenSearch(query)
    const coinIds = coins?.map(tk => tk.id)

    if (coinIds && coinIds.length > 0) {
      const pricePromise = tokenService.getPriceWithMarketDataByCoinIds(
        coinIds,
        currency as VsCurrencyType
      )

      const marketPromise = await tokenService.getMarkets({
        currency: currency as VsCurrencyType,
        coinIds,
        ...getMarketsCommonParams
      })

      const [pricesRaw, marketsRaw] = await Promise.all([
        pricePromise,
        marketPromise
      ])

      const tokens: MarketToken[] = []
      const charts: Charts = {}

      marketsRaw.forEach(market => {
        tokens.push({
          id: market.id,
          symbol: market.symbol,
          name: market.name,
          logoUri: market.image
        })

        charts[market.id] = transformSparklineData(market.sparkline_in_7d.price)
      })

      const prices: Prices = {}

      for (const tokenId in pricesRaw) {
        const pricesInCurrency = pricesRaw[tokenId]
        if (!pricesInCurrency) continue
        const price = pricesInCurrency[currency as VsCurrencyType]
        prices[tokenId] = {
          priceInCurrency: price?.price ?? 0,
          change24: price?.change24 ?? 0,
          marketCap: price?.marketCap ?? 0,
          vol24: price?.vol24 ?? 0
        }
      }

      return { tokens, charts, prices }
    }

    return undefined
  }
}

export default new WatchlistService()
