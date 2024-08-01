import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'

const KNOWN_IDS: { [key: string]: string } = {
  BTC: 'bitcoin',
  AVAX: 'avalanche-2',
  ETH: 'ethereum'
}

export const useCoinGeckoId = (tokenSymbol?: string): string | undefined => {
  const tokenInfoData = useTokenInfoContext()

  return (
    tokenSymbol &&
    (KNOWN_IDS[tokenSymbol] || tokenInfoData?.[tokenSymbol]?.coingeckoId)
  )
}
