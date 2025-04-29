import { TokenInfoData } from '@avalabs/core-bridge-sdk'
import { KNOWN_IDS } from 'hooks/useCoinGeckoId'
import { getOriginalSymbol } from './bridgeUtils'

export const getCoingeckoId = (
  symbol: string,
  tokenInfoData?: TokenInfoData
): string | undefined => {
  const originalSymbol = getOriginalSymbol(symbol)

  if (tokenInfoData === undefined) {
    return undefined
  }

  return (
    originalSymbol &&
    (KNOWN_IDS[originalSymbol] || tokenInfoData?.[originalSymbol]?.coingeckoId)
  )
}
