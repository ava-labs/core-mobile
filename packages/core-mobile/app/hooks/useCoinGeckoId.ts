import { useTokenInfoContext } from '@avalabs/core-bridge-sdk'
import {
  AVAX_COINGECKO_ID,
  BITCOIN_COINGECKO_ID,
  ETHEREUM_COINGECKO_ID
} from 'consts/coingecko'

const KNOWN_IDS: { [key: string]: string } = {
  BTC: BITCOIN_COINGECKO_ID,
  AVAX: AVAX_COINGECKO_ID,
  ETH: ETHEREUM_COINGECKO_ID
}

export const useCoinGeckoId = (tokenSymbol?: string): string | undefined => {
  const tokenInfoData = useTokenInfoContext()

  return (
    tokenSymbol &&
    (KNOWN_IDS[tokenSymbol] || tokenInfoData?.[tokenSymbol]?.coingeckoId)
  )
}
