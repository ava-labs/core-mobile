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

type Params = {
  initialTokenIdFrom?: string
  initialTokenIdTo?: string
  initialFromCaip2Id?: string
  initialToCaip2Id?: string
}

// internalIds are either NATIVE-* or CAIP-2 formatted (contain ':')
// anything else is treated as a raw contract address
const isRawAddress = (id: string): boolean =>
  !id.startsWith('NATIVE') && !id.includes(':')

// Build the lookup entry for the token aggregator API
const toLookupEntry = (
  id: string,
  caip2Id?: string
): Caip2IdAddressPair | InternalId =>
  isRawAddress(id) && caip2Id
    ? { caip2Id, address: id.toLowerCase() }
    : { internalId: id.startsWith('NATIVE') ? id : id.toLowerCase() }

// Build the map key matching tokenToKey in useTokensWithPrice
const toTokensKey = (id: string, caip2Id?: string): string => {
  if (isRawAddress(id) && caip2Id)
    return `${caip2Id.toLowerCase()}-${id.toLowerCase()}`
  return id.startsWith('NATIVE') ? id : id.toLowerCase()
}

export function useFusionTokenLookup({
  params,
  accountTokens,
  isDeveloperMode,
  setFromToken,
  setToToken
}: {
  params: Params
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
    if (params.initialTokenIdFrom)
      ids.push(
        toLookupEntry(params.initialTokenIdFrom, params.initialFromCaip2Id)
      )
    if (params.initialTokenIdTo)
      ids.push(toLookupEntry(params.initialTokenIdTo, params.initialToCaip2Id))
    return ids
  }, [
    params.initialTokenIdFrom,
    params.initialTokenIdTo,
    params.initialFromCaip2Id,
    params.initialToCaip2Id
  ])

  const { data: tokens, isLoading: isTokensLoading } =
    useTokenLookup(lookupTokenIds)

  const fromTokenChainId = useMemo(() => {
    if (!params.initialFromCaip2Id) return undefined
    return getChainIdFromCaip2(params.initialFromCaip2Id)
  }, [params.initialFromCaip2Id])

  const toTokenChainId = useMemo(() => {
    if (!params.initialToCaip2Id) return undefined
    return getChainIdFromCaip2(params.initialToCaip2Id)
  }, [params.initialToCaip2Id])

  const btcBLocalToken = useMemo(() => {
    const tokenInfo = tokens[tokenIds.BTC_B.toLowerCase()]
    if (!tokenInfo) return undefined
    return buildLocalToken({
      accountTokens,
      tokenInfo,
      caip2Id: isDeveloperMode ? caip2ChainIds.FUJI : caip2ChainIds.C_CHAIN,
      chainId: isDeveloperMode
        ? EvmChainId.AVALANCHE_TESTNET
        : EvmChainId.AVALANCHE_MAINNET
    })
  }, [tokens, accountTokens, isDeveloperMode])

  const initialized = useRef(false)

  const setInitialTokensFx = useCallback(() => {
    if (initialized.current) return

    const initialTokenIdFrom = params.initialTokenIdFrom
    const initialTokenIdTo = params.initialTokenIdTo

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
        tokens[toTokensKey(initialTokenIdFrom, params.initialFromCaip2Id)]

      initialFromToken =
        fromTokenInfo &&
        params.initialFromCaip2Id &&
        Number.isFinite(fromTokenChainId)
          ? buildLocalToken({
              accountTokens,
              tokenInfo: fromTokenInfo,
              caip2Id: params.initialFromCaip2Id,
              chainId: fromTokenChainId as number
            })
          : undefined
    }
    setFromToken(initialFromToken)

    let initialToToken: LocalTokenWithBalance | undefined
    if (initialTokenIdTo) {
      const toTokenInfo =
        tokens[toTokensKey(initialTokenIdTo, params.initialToCaip2Id)]

      initialToToken =
        toTokenInfo &&
        params.initialToCaip2Id &&
        Number.isFinite(toTokenChainId)
          ? buildLocalToken({
              accountTokens,
              tokenInfo: toTokenInfo,
              caip2Id: params.initialToCaip2Id,
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
    params.initialFromCaip2Id,
    params.initialToCaip2Id,
    params.initialTokenIdFrom,
    params.initialTokenIdTo,
    setFromToken,
    setToToken,
    toTokenChainId,
    tokens
  ])

  useEffect(setInitialTokensFx, [setInitialTokensFx])

  return { tokens, isTokensLoading, btcBLocalToken }
}
