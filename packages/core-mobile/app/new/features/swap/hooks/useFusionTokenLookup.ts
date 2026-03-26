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
  const lookupTokenIds = useMemo(() => {
    const ids: Array<Caip2IdAddressPair | InternalId> = [
      { internalId: tokenIds.BTC_B }
    ]
    if (tokenInfo.initialTokenIdFrom)
      ids.push(
        toLookupEntry(
          tokenInfo.initialTokenIdFrom,
          tokenInfo.initialFromCaip2Id
        )
      )
    if (tokenInfo.initialTokenIdTo)
      ids.push(
        toLookupEntry(tokenInfo.initialTokenIdTo, tokenInfo.initialToCaip2Id)
      )
    return ids
  }, [
    tokenInfo.initialTokenIdFrom,
    tokenInfo.initialTokenIdTo,
    tokenInfo.initialFromCaip2Id,
    tokenInfo.initialToCaip2Id
  ])

  const { data: tokens, isLoading: isTokensLoading } =
    useTokenLookup(lookupTokenIds)

  const fromTokenChainId = useMemo(() => {
    if (!tokenInfo.initialFromCaip2Id) return undefined
    return getChainIdFromCaip2(tokenInfo.initialFromCaip2Id)
  }, [tokenInfo.initialFromCaip2Id])

  const toTokenChainId = useMemo(() => {
    if (!tokenInfo.initialToCaip2Id) return undefined
    return getChainIdFromCaip2(tokenInfo.initialToCaip2Id)
  }, [tokenInfo.initialToCaip2Id])

  const btcBLocalToken = useMemo(() => {
    const token = tokens[tokenIds.BTC_B.toLowerCase()]
    if (!token) return undefined
    return buildLocalToken({
      accountTokens,
      tokenInfo: token,
      caip2Id: isDeveloperMode ? caip2ChainIds.FUJI : caip2ChainIds.C_CHAIN,
      chainId: isDeveloperMode
        ? EvmChainId.AVALANCHE_TESTNET
        : EvmChainId.AVALANCHE_MAINNET
    })
  }, [tokens, accountTokens, isDeveloperMode])

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

    let initialFromToken: LocalTokenWithBalance | undefined
    if (initialTokenIdFrom) {
      const fromTokenInfo =
        tokens[toTokensKey(initialTokenIdFrom, tokenInfo.initialFromCaip2Id)]

      initialFromToken =
        fromTokenInfo &&
        tokenInfo.initialFromCaip2Id &&
        Number.isFinite(fromTokenChainId)
          ? buildLocalToken({
              accountTokens,
              tokenInfo: fromTokenInfo,
              caip2Id: tokenInfo.initialFromCaip2Id,
              chainId: fromTokenChainId as number
            })
          : undefined
    }
    setFromToken(initialFromToken)

    let initialToToken: LocalTokenWithBalance | undefined
    if (initialTokenIdTo) {
      const toTokenInfo =
        tokens[toTokensKey(initialTokenIdTo, tokenInfo.initialToCaip2Id)]

      initialToToken =
        toTokenInfo &&
        tokenInfo.initialToCaip2Id &&
        Number.isFinite(toTokenChainId)
          ? buildLocalToken({
              accountTokens,
              tokenInfo: toTokenInfo,
              caip2Id: tokenInfo.initialToCaip2Id,
              chainId: toTokenChainId as number
            })
          : undefined
    }
    setToToken(initialToToken)

    initialized.current = true
  }, [
    accountTokens,
    fromTokenChainId,
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
