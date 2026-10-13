import { type TokenInfo } from 'common/hooks/useTokenLookup'
import { tokenLookupKey } from 'common/utils/tokenLookup'
import type { DefiMarket } from '../types'

// Native-asset markets (asset.contractAddress undefined) have no token-lookup
// entry, so their icon comes from nativeIconUrl instead; skip if a market
// already has an iconUrl (aaveInsertAvax sets one explicitly for its
// synthesized AVAX row) to avoid clobbering it.
export function resolveDefiMarketIconUrls(
  markets: DefiMarket[],
  {
    caip2Id,
    tokenInfoByKey,
    nativeIconUrl
  }: {
    caip2Id: string | undefined
    tokenInfoByKey: { [key: string]: TokenInfo }
    nativeIconUrl?: string
  }
): DefiMarket[] {
  return markets.map(market => {
    const address = market.asset.contractAddress

    if (!address) {
      if (market.asset.iconUrl !== undefined || nativeIconUrl === undefined) {
        return market
      }
      return {
        ...market,
        asset: { ...market.asset, iconUrl: nativeIconUrl }
      }
    }

    if (!caip2Id) {
      return market
    }

    const info = tokenInfoByKey[tokenLookupKey(caip2Id, address)]
    const logoUri = info?.meta?.logoUri ?? undefined

    if (!logoUri) {
      return market
    }

    return {
      ...market,
      asset: { ...market.asset, iconUrl: logoUri }
    }
  })
}
