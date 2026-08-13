import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance'
import { getEvmCaip2ChainId, getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import type { Caip2IdAddressPair } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenLookupKey, useTokenLookup } from 'common/hooks/useTokenLookup'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  SOLANA_MELD_CHAIN_ID
} from '../consts'
import type { ServiceProviderCategories } from '../consts'
import { CryptoCurrency } from '../types'
import { useMeldToken } from '../store'
import { isTokenTradable } from '../utils'

const SOLANA_CAIP2_ID = getSolanaCaip2ChainId(ChainId.SOLANA_MAINNET_ID)
const FALLBACK_DECIMALS = 18

type TokenLookupData = ReturnType<typeof useTokenLookup>['data']

// Native gas tokens (zero-address) and BTC/SOL are intentionally excluded --
// they only ever resolve via the held-token branch (parity with the old
// full-catalog behavior, which never synthesized unheld natives either).
const getLookupPair = (
  crypto: CryptoCurrency
): Caip2IdAddressPair | undefined => {
  if (
    !crypto.contractAddress ||
    !crypto.chainId ||
    crypto.contractAddress.toLowerCase() ===
      NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS.toLowerCase()
  ) {
    return undefined
  }

  if (crypto.chainId === SOLANA_MELD_CHAIN_ID.toString()) {
    return { caip2Id: SOLANA_CAIP2_ID, address: crypto.contractAddress }
  }

  const numericChainId = Number(crypto.chainId)
  if (!Number.isFinite(numericChainId)) return undefined

  return {
    caip2Id: getEvmCaip2ChainId(numericChainId),
    address: crypto.contractAddress
  }
}

// Synthesizes a zero-balance `LocalTokenWithBalance` from a v1 token-lookup
// hit -- mirrors the zero-balance shape the old catalog-based synthesis used.
const buildLookupMatch = (
  lookupPair: Caip2IdAddressPair | undefined,
  lookupTokens: TokenLookupData,
  fallbackChainId: number | undefined
): LocalTokenWithBalance | undefined => {
  if (!lookupPair) return undefined
  const info =
    lookupTokens[tokenLookupKey(lookupPair.caip2Id, lookupPair.address)]
  if (!info) return undefined

  const isSolana = lookupPair.caip2Id === SOLANA_CAIP2_ID
  const decimals =
    info.meta?.decimals?.[lookupPair.caip2Id] ?? FALLBACK_DECIMALS

  return {
    type: isSolana ? TokenType.SPL : TokenType.ERC20,
    symbol: info.symbol,
    name: info.name,
    description: info.name,
    decimals,
    logoUri: info.meta?.logoUri ?? undefined,
    address: lookupPair.address,
    localId: lookupPair.address,
    internalId: info.internalId,
    networkChainId: isSolana ? ChainId.SOLANA_MAINNET_ID : fallbackChainId,
    // Mirrors networkChainId -- SelectServiceProvider's `getNetwork()` call
    // reads `chainId` (not `networkChainId`) when it's present on the token.
    chainId: isSolana ? ChainId.SOLANA_MAINNET_ID : fallbackChainId,
    isDataAccurate: true,
    balance: 0n,
    balanceDisplayValue: '0',
    balanceInCurrency: 0,
    priceInCurrency: 0,
    reputation: null
  } as LocalTokenWithBalance
}

// `category` no longer affects resolution (held-first, then a targeted
// lookup, regardless of onramp/offramp) but is kept in the signature so the
// existing call sites (useSelectAmount, useFiatSourceAmount,
// SelectServiceProvider) don't need to change.
export const useMeldTokenWithBalance = (_params: {
  category: ServiceProviderCategories
}): {
  token:
    | (CryptoCurrency & { tokenWithBalance: LocalTokenWithBalance })
    | undefined
  // True only while a lookup for a real (unheld) candidate is in flight --
  // false for the no-lookup-needed cases (native/BTC/SOL, or a genuine no
  // match) so callers can gate a loading affordance without it getting stuck
  // on forever on tokens that were never going to resolve.
  isLoading: boolean
} => {
  const [meldToken] = useMeldToken()
  const activeAccount = useSelector(selectActiveAccount)
  // Unscoped (no chainId) -- the selected Meld currency can be on any chain,
  // matching the prior full-catalog lookup's account-wide held-token merge.
  const heldTokens = useTokensWithBalanceForAccount({ account: activeAccount })

  const heldMatch = useMemo(
    () => heldTokens.find(tk => meldToken && isTokenTradable(meldToken, tk)),
    [heldTokens, meldToken]
  )

  const lookupPair = useMemo(
    () => (heldMatch || !meldToken ? undefined : getLookupPair(meldToken)),
    [heldMatch, meldToken]
  )
  const { data: lookupTokens, isLoading: isLookupLoading } = useTokenLookup(
    lookupPair ? [lookupPair] : []
  )

  const lookupMatch = useMemo(
    () =>
      buildLookupMatch(
        lookupPair,
        lookupTokens,
        meldToken?.chainId ? Number(meldToken.chainId) : undefined
      ),
    [lookupPair, lookupTokens, meldToken]
  )

  const token = useMemo(() => {
    if (!meldToken) return undefined
    const tokenWithBalance = heldMatch ?? lookupMatch
    if (!tokenWithBalance) return undefined
    return { ...meldToken, tokenWithBalance }
  }, [meldToken, heldMatch, lookupMatch])

  const isLoading = useMemo(
    () => Boolean(lookupPair) && isLookupLoading && !lookupMatch,
    [lookupPair, isLookupLoading, lookupMatch]
  )

  return { token, isLoading }
}
