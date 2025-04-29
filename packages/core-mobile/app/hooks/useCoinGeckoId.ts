import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import { getOriginalSymbol } from 'common/utils/bridgeUtils'
import {
  AVAX_COINGECKO_ID,
  BITCOIN_COINGECKO_ID,
  ETHEREUM_COINGECKO_ID
} from 'consts/coingecko'
import { useMemo } from 'react'

export const KNOWN_IDS: { [key: string]: string } = {
  BTC: BITCOIN_COINGECKO_ID,
  AVAX: AVAX_COINGECKO_ID,
  ETH: ETHEREUM_COINGECKO_ID
}

export const useCoinGeckoId = (tokenSymbol?: string): string | undefined => {
  const tokenInfoData = useTokenInfoContext()

  const originalSymbol = useMemo(() => {
    return tokenSymbol ? getOriginalSymbol(tokenSymbol) : undefined
  }, [tokenSymbol])

  return (
    originalSymbol &&
    (KNOWN_IDS[originalSymbol] || tokenInfoData?.[originalSymbol]?.coingeckoId)
  )
}
