import { Chain } from '@avalabs/bridge-unified'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import Big from 'big.js'
import {
  AVAX_COINGECKO_ID,
  BITCOIN_COINGECKO_ID,
  ETHEREUM_COINGECKO_ID
} from 'consts/coingecko'
import { useSimplePrices } from 'hooks/useSimplePrices'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useMemo } from 'react'

const NATIVE_SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  AVAX: AVAX_COINGECKO_ID,
  BTC: BITCOIN_COINGECKO_ID,
  ETH: ETHEREUM_COINGECKO_ID
}

export const useBridgeNetworkPrice = (chain?: Chain): Big => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const coingeckoId = chain
    ? NATIVE_SYMBOL_TO_COINGECKO_ID[chain.networkToken.symbol]
    : undefined

  const { data: prices } = useSimplePrices(
    coingeckoId ? [coingeckoId] : [],
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  return useMemo(() => {
    const price = coingeckoId ? prices?.[coingeckoId] : undefined
    return price !== undefined ? new Big(price) : new Big(0)
  }, [coingeckoId, prices])
}
