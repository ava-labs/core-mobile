import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  TokenType as SdkTokenType,
  type QuoteFees
} from '@avalabs/unified-asset-transfer'
import type {
  Caip2IdAddressPair,
  InternalId
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { selectSelectedCurrency } from 'store/settings/currency'
import {
  useTokensWithPrice,
  type TokenWithPriceData
} from 'common/hooks/useTokensWithPrice'
import { TOKEN_IDS } from 'consts/tokenIds'

type FeeBreakdownItem = {
  name: string
  tokenAmount: string
  fiatAmount?: number // undefined when price data is unavailable
}

type AggregatedFees = {
  total: number
  breakdown: FeeBreakdownItem[]
}

function getNativeInternalId(chainId: string): string | undefined {
  if (chainId === 'eip155:1') return TOKEN_IDS.ETH
  if (chainId === 'eip155:43114') return TOKEN_IDS.AVAX
  if (chainId.startsWith('solana:')) return TOKEN_IDS.SOL
  if (chainId.startsWith('bip122:')) return TOKEN_IDS.BTC
  return undefined
}

const NATIVE_DECIMALS: Record<string, number> = {
  [TOKEN_IDS.ETH]: 18,
  [TOKEN_IDS.AVAX]: 18,
  [TOKEN_IDS.SOL]: 9,
  [TOKEN_IDS.BTC]: 8
}

function getFeeLookupToken(
  fee: QuoteFees[number]
): Caip2IdAddressPair | InternalId | undefined {
  if (fee.token.type !== SdkTokenType.NATIVE) {
    return { caip2Id: fee.chainId, address: fee.token.address }
  }
  const internalId = getNativeInternalId(fee.chainId)
  return internalId ? { internalId } : undefined
}

function findTokenEntry(
  lookup: Caip2IdAddressPair | InternalId,
  chainId: string,
  tokenPriceData: TokenWithPriceData[]
): TokenWithPriceData | undefined {
  if ('internalId' in lookup) {
    return tokenPriceData.find(e => e.internalId === lookup.internalId)
  }
  return tokenPriceData.find(
    e => e.platforms?.[chainId]?.toLowerCase() === lookup.address.toLowerCase()
  )
}

function getDecimals(
  entry: TokenWithPriceData,
  chainId: string,
  lookup: Caip2IdAddressPair | InternalId
): number | undefined {
  return (
    entry.meta?.decimals?.[chainId] ??
    ('internalId' in lookup ? NATIVE_DECIMALS[lookup.internalId] : undefined)
  )
}

function buildBreakdownItem(
  fee: QuoteFees[number],
  entry: TokenWithPriceData,
  currency: string
): FeeBreakdownItem | undefined {
  const lookup = getFeeLookupToken(fee)
  if (!lookup) return undefined
  const decimals = getDecimals(entry, fee.chainId, lookup)
  if (decimals == null) return undefined

  const tokenUnit = new TokenUnit(fee.amount, decimals, entry.symbol)
  const tokenAmount = `${tokenUnit.toDisplay()} ${entry.symbol}`
  const price = entry.priceInfo?.[currency.toLowerCase()]?.price

  if (price != null) {
    return {
      name: fee.name,
      tokenAmount,
      fiatAmount: tokenUnit.mul(price).toDisplay({ asNumber: true })
    }
  }
  return { name: fee.name, tokenAmount }
}

export function useQuoteFees(
  fees: QuoteFees | undefined
): AggregatedFees | undefined {
  const currency = useSelector(selectSelectedCurrency)

  const lookupTokens = useMemo(() => {
    if (!fees?.length) return []

    const seen = new Set<string>()
    const tokens: Array<Caip2IdAddressPair | InternalId> = []

    for (const fee of fees) {
      const lookup = getFeeLookupToken(fee)
      if (!lookup) continue

      const key =
        'internalId' in lookup
          ? lookup.internalId
          : `${lookup.caip2Id}:${lookup.address.toLowerCase()}`

      if (!seen.has(key)) {
        seen.add(key)
        tokens.push(lookup)
      }
    }

    return tokens
  }, [fees])

  const tokenPriceData = useTokensWithPrice(lookupTokens)

  return useMemo(() => {
    if (!fees?.length || !tokenPriceData.length) return undefined

    let total = 0
    const breakdown: FeeBreakdownItem[] = []

    for (const fee of fees) {
      const lookup = getFeeLookupToken(fee)
      if (!lookup) continue

      const entry = findTokenEntry(lookup, fee.chainId, tokenPriceData)
      if (!entry) continue

      const item = buildBreakdownItem(fee, entry, currency)
      if (!item) continue

      total += item.fiatAmount ?? 0
      breakdown.push(item)
    }

    return breakdown.length > 0 ? { total, breakdown } : undefined
  }, [fees, tokenPriceData, currency])
}
