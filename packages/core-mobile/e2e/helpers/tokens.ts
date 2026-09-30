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

// Pinned so runs don't depend on live market data (do not query CoinGecko here)
export const trendingToken: TokenDetailToken = {
  id: 'avalanche-2',
  symbol: 'AVAX',
  name: 'Avalanche'
}
