type UniqueMarketIdParams = {
  marketName: string
  asset: { symbol: string; contractAddress?: string; mintTokenAddress: string }
}

export const getUniqueMarketId = (market: UniqueMarketIdParams): string => {
  return `${market.marketName}:${market.asset?.symbol}:${
    market.asset?.contractAddress ?? market.asset?.mintTokenAddress
  }`
}
