export const Tokens = [
  { symbol: 'COQ', name: 'Coq Inu', amount: '0.000001' },
  { symbol: 'WETH.e', name: 'Wrapped ETH', amount: '0.000001' },
  { symbol: 'BTC.b', name: 'Bitcoin', amount: '0.000001' },
  { symbol: 'USDT', name: 'Tether', amount: '0.00001' },
  { symbol: 'USDC', name: 'USD Coin', amount: '0.00001' },
  { symbol: 'AAVE', name: 'Aave Token', amount: '0.000001' }
]

export const SwapTokens: SwapToken[] = [
  { symbol: 'BTC.b', name: 'Bitcoin', amount: '0.0001' },
  { symbol: 'ETH', name: 'Ether', amount: '0.00001' },
  { symbol: 'WETH.e', name: 'Wrapped ETH', amount: '0.000001' },
  { symbol: 'USDT', name: 'Tether', amount: '0.00001' },
  { symbol: 'USDC', name: 'USD Coin', amount: '0.00001' },
  { symbol: 'LINK.e', name: 'Chainlink Token', amount: '0.000001' },
  { symbol: 'KET', name: 'KET', amount: '0.000001' },
  { symbol: '1INCH.e', name: '1INCH Token', amount: '0.000001' },
  { symbol: 'BLUB', name: 'Blub', amount: '0.000001' },
  { symbol: 'COQ', name: 'Coq Inu', amount: '0.000001' }
]

export type SwapToken = {
  symbol: string
  name: string
  amount: string
}

export type TokenDetailToken = {
  id: string
  symbol: string
  name: string
  price?: number
}

export interface TokenPriceResponse {
  [key: string]: {
    usd: number
  }
}

export interface Coin {
  id: string
  symbol: string
  name: string
  current_price: number
  image: string
  price_change_percentage_24h: number
}

export const topTwentyTrendingTokens = async (): Promise<Coin[]> => {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=avalanche-ecosystem&price_change_percentage=24h&per_page=100&page=1`
  )
  const data: Coin[] = (await response.json()) as Coin[]
  data.sort(
    (
      a: { price_change_percentage_24h: number },
      b: { price_change_percentage_24h: number }
    ) => b.price_change_percentage_24h - a.price_change_percentage_24h
  )

  return data.slice(0, 20).map(coin => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    current_price: coin.current_price,
    image: coin.image,
    price_change_percentage_24h: coin.price_change_percentage_24h
  }))
}
