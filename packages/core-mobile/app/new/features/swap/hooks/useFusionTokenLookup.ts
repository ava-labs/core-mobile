import { useCallback, useEffect, useMemo, useRef } from 'react'
import { tokenIds } from 'consts/tokenIds'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { useTokenLookup, type TokenInfo } from 'common/hooks/useTokenLookup'
import type {
  Caip2IdAddressPair,
  InternalId
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { EvmChainId } from '@avalabs/fusion-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { buildLocalToken } from '../utils/buildLocalToken'

type InitialTokenInfo = {
  initialTokenIdFrom?: string
  initialTokenIdTo?: string
  initialFromCaip2Id?: string
  initialToCaip2Id?: string
}

// internalIds are either NATIVE-* or CAIP-2 formatted (contain ':')
// anything else is treated as a raw contract address
const isRawAddress = (id: string): boolean =>
  !id.toUpperCase().startsWith('NATIVE') && !id.includes(':')

// Normalize NATIVE-* IDs to canonical form (e.g. "NATIVE-AVAX" → "NATIVE-avax")
const normalizeId = (id: string): string =>
  id.toUpperCase().startsWith('NATIVE-')
    ? `NATIVE-${id.slice(7).toLowerCase()}`
    : id.toLowerCase()

// Build the lookup entry for the token aggregator API
const toLookupEntry = (
  id: string,
  caip2Id?: string
): Caip2IdAddressPair | InternalId =>
  isRawAddress(id) && caip2Id
    ? { caip2Id, address: id.toLowerCase() }
    : { internalId: normalizeId(id) }

// Build the map key matching tokenToKey in useTokensWithPrice
const toTokensKey = (id: string, caip2Id?: string): string => {
  if (isRawAddress(id) && caip2Id)
    return `${caip2Id.toLowerCase()}-${id.toLowerCase()}`
  return normalizeId(id)
}

// Build the list of token IDs to look up from the token aggregator API
const buildLookupTokenIds = ({
  btcBTokenId,
  tokenInfo
}: {
  btcBTokenId: string
  tokenInfo: InitialTokenInfo
}): Array<Caip2IdAddressPair | InternalId> => {
  const ids: Array<Caip2IdAddressPair | InternalId> = [
    { internalId: btcBTokenId }
  ]
  if (tokenInfo.initialTokenIdFrom)
    ids.push(
      toLookupEntry(tokenInfo.initialTokenIdFrom, tokenInfo.initialFromCaip2Id)
    )
  if (tokenInfo.initialTokenIdTo)
    ids.push(
      toLookupEntry(tokenInfo.initialTokenIdTo, tokenInfo.initialToCaip2Id)
    )
  return ids
}

// Build the BTC.b local token using the correct chain for the current environment
const buildBtcBLocalToken = ({
  tokens,
  btcBTokenId,
  accountTokens,
  isDeveloperMode
}: {
  tokens: { [key: string]: TokenInfo }
  btcBTokenId: string
  accountTokens: LocalTokenWithBalance[]
  isDeveloperMode: boolean
}): LocalTokenWithBalance | undefined => {
  const token = tokens[btcBTokenId.toLowerCase()]
  if (!token) return undefined
  return buildLocalToken({
    accountTokens,
    tokenInfo: token,
    caip2Id: isDeveloperMode ? caip2ChainIds.FUJI : caip2ChainIds.C_CHAIN,
    chainId: isDeveloperMode
      ? EvmChainId.AVALANCHE_TESTNET
      : EvmChainId.AVALANCHE_MAINNET
  })
}

// Resolve a token ID + chain context to a LocalTokenWithBalance, or undefined
// if any required piece (token info, caip2Id, chainId) is missing.
const resolveInitialToken = ({
  tokenId,
  caip2Id,
  chainId,
  accountTokens,
  tokens
}: {
  tokenId: string
  caip2Id: string | undefined
  chainId: number | undefined
  accountTokens: LocalTokenWithBalance[]
  tokens: { [key: string]: TokenInfo }
}): LocalTokenWithBalance | undefined => {
  const tokenInfoEntry = tokens[toTokensKey(tokenId, caip2Id)]
  if (!tokenInfoEntry || !caip2Id || !Number.isFinite(chainId)) return undefined
  return buildLocalToken({
    accountTokens,
    tokenInfo: tokenInfoEntry,
    caip2Id,
    chainId: chainId as number
  })
}

// Whether to preselect the initial "to" token. In testnet (developer mode) we
// skip it because initial to-tokens like USDC are mainnet-only and would yield
// a broken no-quotes state. Native AVAX is the exception — it's supported on
// Fuji and is the CCT destination for P/X → C swaps, so it's safe to preselect.
export const shouldPreselectToToken = (
  initialTokenIdTo: string | undefined,
  isDeveloperMode: boolean
): initialTokenIdTo is string => {
  if (!initialTokenIdTo) return false
  return !isDeveloperMode || normalizeId(initialTokenIdTo) === tokenIds.AVAX
}

export function useFusionTokenLookup({
  tokenInfo,
  accountTokens,
  isDeveloperMode,
  setFromToken,
  setToToken
}: {
  tokenInfo: InitialTokenInfo
  accountTokens: LocalTokenWithBalance[]
  isDeveloperMode: boolean
  setFromToken: (token: LocalTokenWithBalance | undefined) => void
  setToToken: (token: LocalTokenWithBalance | undefined) => void
}): {
  tokens: { [key: string]: TokenInfo }
  isTokensLoading: boolean
  btcBLocalToken: LocalTokenWithBalance | undefined
} {
  const btcBTokenId = isDeveloperMode ? tokenIds.BTC_B_FUJI : tokenIds.BTC_B

  const lookupTokenIds = useMemo(
    () => buildLookupTokenIds({ btcBTokenId, tokenInfo }),
    [btcBTokenId, tokenInfo]
  )

  const { data: tokens, isLoading: isTokensLoading } =
    useTokenLookup(lookupTokenIds)

  // Simple lookups — no need to memoize a fast string→number conversion
  const fromTokenChainId = tokenInfo.initialFromCaip2Id
    ? getChainIdFromCaip2(tokenInfo.initialFromCaip2Id)
    : undefined
  const toTokenChainId = tokenInfo.initialToCaip2Id
    ? getChainIdFromCaip2(tokenInfo.initialToCaip2Id)
    : undefined

  const btcBLocalToken = useMemo(
    () =>
      buildBtcBLocalToken({
        tokens,
        btcBTokenId,
        accountTokens,
        isDeveloperMode
      }),
    [tokens, accountTokens, isDeveloperMode, btcBTokenId]
  )

  const initialized = useRef(false)

  const setInitialTokensFx = useCallback(() => {
    if (initialized.current) return

    const initialTokenIdFrom = tokenInfo.initialTokenIdFrom
    const initialTokenIdTo = tokenInfo.initialTokenIdTo

    if (!initialTokenIdFrom && !initialTokenIdTo) {
      initialized.current = true
      return
    }

    // Wait for token lookup and account balances to complete before initializing
    // so we don't commit to undefined tokens or zero balances and block retries.
    if (isTokensLoading) return

    setFromToken(
      initialTokenIdFrom
        ? resolveInitialToken({
            tokenId: initialTokenIdFrom,
            caip2Id: tokenInfo.initialFromCaip2Id,
            chainId: fromTokenChainId,
            accountTokens,
            tokens
          })
        : undefined
    )

    setToToken(
      shouldPreselectToToken(initialTokenIdTo, isDeveloperMode)
        ? resolveInitialToken({
            tokenId: initialTokenIdTo,
            caip2Id: tokenInfo.initialToCaip2Id,
            chainId: toTokenChainId,
            accountTokens,
            tokens
          })
        : undefined
    )

    initialized.current = true
  }, [
    accountTokens,
    fromTokenChainId,
    isDeveloperMode,
    isTokensLoading,
    tokenInfo.initialFromCaip2Id,
    tokenInfo.initialToCaip2Id,
    tokenInfo.initialTokenIdFrom,
    tokenInfo.initialTokenIdTo,
    setFromToken,
    setToToken,
    toTokenChainId,
    tokens
  ])

  useEffect(setInitialTokensFx, [setInitialTokensFx])

  return { tokens, isTokensLoading, btcBLocalToken }
}
