import { Network } from '@avalabs/chains-sdk'
import { CoinMarket, VsCurrencyType } from '@avalabs/coingecko-sdk'
import TokenService from 'services/token/TokenService'
import { transformSparklineData } from 'services/token/utils'
import { Charts, MarketToken, Prices } from 'store/watchlist'
import Logger from 'utils/Logger'

const coinByAddress = require('assets/coinByAddress.json')
const coinBySymbol = require('assets/coinBySymbol.json')

const notFoundId = -1

const getCoingeckoId = (address: string, symbol: string) => {
  // first try looking up by address
  // if that fails, try looking up by symbol

  // notes:
  // looking up by symbol is not 100% accurate as there are tokens
  // with the same symbol but they have different data (different coingecko ids, prices,...)
  if (coinByAddress[address] && coinByAddress[address].symbol === symbol) {
    return coinByAddress[address].id
  }

  if (coinBySymbol[symbol]) {
    return coinBySymbol[symbol].id
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
    // 1. get top 100 tokens with sparkline data
    const top100Tokens = await TokenService.getMarkets(
      currency.toLowerCase() as VsCurrencyType,
      true
    )

    // 2. get all network contract tokens + favorite tokens with sparkline data
    const top100TokenIds = top100Tokens.map(token => token.id)

    const tokenIdsToFetch: string[] = []

    allNetworks.forEach(({ tokens }) => {
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
          top100TokenIds.includes(coingeckoId) ||
          tokenIdsToFetch.includes(coingeckoId)
        ) {
          coingeckoId === notFoundId &&
            Logger.info(
              'could not find a coingecko id for token',
              `address: ${tk.address} - symbol: ${tk.symbol}`
            )
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
      otherTokens = await TokenService.getMarkets(
        currency as VsCurrencyType,
        true,
        tokenIdsToFetch
      )
    }

    const tokens: Record<string, MarketToken> = {}
    const charts: Charts = {}

    // 3. combine 1 and 2 and extract tokens and charts data
    top100Tokens.concat(otherTokens).forEach(token => {
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
    const pricesRaw = await TokenService.getPriceWithMarketDataByCoinIds(
      coingeckoIds,
      currency as VsCurrencyType
    )

    const prices: Prices = {}

    for (const price in pricesRaw) {
      const entry = pricesRaw[price][currency as VsCurrencyType]
      prices[price] = {
        priceInCurrency: entry?.price ?? 0,
        change24: entry?.change24 ?? 0,
        marketCap: entry?.marketCap ?? 0,
        vol24: entry?.vol24 ?? 0
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
    const coins = await TokenService.getTokenSearch(query)
    const coinIds = coins?.map(tk => tk.id)

    if (coinIds && coinIds.length > 0) {
      const pricePromise = TokenService.getPriceWithMarketDataByCoinIds(
        coinIds,
        currency as VsCurrencyType
      )

      const marketPromise = await TokenService.getMarkets(
        currency as VsCurrencyType,
        true,
        coinIds
      )
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

      for (const price in pricesRaw) {
        const entry = pricesRaw[price][currency as VsCurrencyType]
        prices[price] = {
          priceInCurrency: entry?.price ?? 0,
          change24: entry?.change24 ?? 0,
          marketCap: entry?.marketCap ?? 0,
          vol24: entry?.vol24 ?? 0
        }
      }

      return { tokens, charts, prices }
    }

    return undefined
  }
}

export default new WatchlistService()
