import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { selectAllCustomTokens } from 'store/customToken'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useTokenLookup, type TokenInfo } from 'common/hooks/useTokenLookup'
import { tokenLookupResponseKey } from 'common/utils/tokenLookup'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import Logger from 'utils/Logger'
import { meldContractTokenKey } from '../utils'
import { NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS } from '../consts'
import { CryptoCurrency } from '../types'

type MeldContractTokenMap = Map<string, NetworkContractToken>

type MeldTokenCandidate = {
  chainId: number
  address: string
  caip2Id: string
}

/**
 * Narrows a Meld currency to something worth looking up, or drops it.
 *
 * Natives are reported under a zero-address sentinel with no catalog entry, and
 * `resolveTokenWithBalance` resolves them from held balances before it ever
 * consults this map, so looking them up would be wasted.
 */
const toCandidate = (
  crypto: CryptoCurrency,
  cChainId: number | undefined
): MeldTokenCandidate | undefined => {
  const { contractAddress, chainId } = crypto
  if (!contractAddress || !chainId) return undefined

  if (
    contractAddress.toLowerCase() ===
    NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS.toLowerCase()
  ) {
    return undefined
  }

  const numericChainId = Number(chainId)

  if (numericChainId !== cChainId) return undefined

  return {
    chainId: numericChainId,
    address: contractAddress,
    caip2Id: getCaip2ChainId(numericChainId)
  }
}

const toContractToken = (
  candidate: MeldTokenCandidate,
  info: TokenInfo
): NetworkContractToken | undefined => {
  const decimals = info.meta?.decimals?.[candidate.caip2Id]

  if (typeof decimals !== 'number') {
    // Every amount this token rendered would be scaled wrong, which is worse
    // than leaving it out of the list.
    Logger.warn('[useMeldContractTokenMap] no decimals for token', {
      address: candidate.address,
      caip2Id: candidate.caip2Id
    })
    return undefined
  }

  // `chainId` is load-bearing, not decorative: `asZeroBalanceToken` derives
  // `networkChainId` from it, and `passesMeldListFilters` drops any token whose
  // `networkChainId` is not in `enabledChainIds`.
  const shared = {
    address: candidate.address,
    chainId: candidate.chainId,
    name: info.name,
    symbol: info.symbol,
    decimals,
    logoUri: info.meta?.logoUri ?? undefined
  }

  return { ...shared, type: TokenType.ERC20 }
}

/**
 * Contract tokens for the Meld currencies passed in, keyed by
 * `meldContractTokenKey`.
 *
 * Resolves them with a single batched `/v1/token/lookup` for the handful of
 * currencies Meld actually supports, rather than downloading the full ~53k
 * C-Chain contract-token catalogs to read a few dozen entries out
 * of them.
 */
export const useMeldContractTokenMap = (
  cryptoCurrencies: CryptoCurrency[]
): MeldContractTokenMap => {
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const cChainId = useCChainNetwork()?.chainId

  const candidates = useMemo(
    () =>
      cryptoCurrencies
        .map(crypto => toCandidate(crypto, cChainId))
        .filter((c): c is MeldTokenCandidate => c !== undefined),
    [cryptoCurrencies, cChainId]
  )

  const lookupIds = useMemo(
    () => candidates.map(({ caip2Id, address }) => ({ caip2Id, address })),
    [candidates]
  )

  const { data: lookupTokens } = useTokenLookup(lookupIds)

  return useMemo(() => {
    const map: MeldContractTokenMap = new Map()

    for (const candidate of candidates) {
      const info = lookupTokens[tokenLookupResponseKey(candidate)]
      if (!info) continue

      const token = toContractToken(candidate, info)
      if (token) {
        map.set(
          meldContractTokenKey(candidate.chainId, candidate.address),
          token
        )
      }
    }

    // Custom tokens are user-added and absent from the aggregator catalog. The
    // contract-token hooks this replaced merged them in for the same chains, so
    // dropping them here would quietly stop resolving them.
    if (cChainId !== undefined) {
      for (const token of allCustomTokens[cChainId] ?? []) {
        map.set(meldContractTokenKey(cChainId, token.address), token)
      }
    }

    return map
  }, [candidates, lookupTokens, cChainId, allCustomTokens])
}
