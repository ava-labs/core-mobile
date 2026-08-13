import { useMemo } from 'react'
import { Address } from 'viem'
import { Network } from '@avalabs/core-chains-sdk'
import { useTokenLookup } from 'common/hooks/useTokenLookup'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { DefiMarket } from '../types'
import { resolveDefiMarketIconUrls } from '../utils/resolveDefiMarketIconUrls'

export function useResolvedDefiMarkets({
  network,
  markets,
  nativeIconUrl
}: {
  network: Network | undefined
  markets: DefiMarket[] | undefined
  nativeIconUrl?: string
}): { data: DefiMarket[] | undefined; isPending: boolean } {
  const caip2Id = useMemo(
    () => (network ? getCaip2ChainId(network.chainId) : undefined),
    [network]
  )

  const lookupTokens = useMemo(() => {
    if (!caip2Id || !markets) {
      return []
    }
    const addresses = new Set(
      markets
        .map(market => market.asset.contractAddress)
        .filter((address): address is Address => address !== undefined)
    )
    return Array.from(addresses).map(address => ({ caip2Id, address }))
  }, [caip2Id, markets])

  const { data: tokenInfoByKey } = useTokenLookup(lookupTokens)

  const data = useMemo(() => {
    if (!markets) {
      return undefined
    }
    // Don't gate on the icon lookup settling: resolveDefiMarketIconUrls
    // tolerates an empty/partial tokenInfoByKey, so markets render right
    // away and icons hydrate in on a later re-render as lookups land.
    return resolveDefiMarketIconUrls(markets, {
      caip2Id,
      tokenInfoByKey,
      nativeIconUrl
    })
  }, [markets, caip2Id, tokenInfoByKey, nativeIconUrl])

  return { data, isPending: markets === undefined }
}
