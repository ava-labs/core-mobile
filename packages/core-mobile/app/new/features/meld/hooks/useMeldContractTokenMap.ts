import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { tokenAddresses } from 'consts/tokenIds'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectAllCustomTokens } from 'store/customToken'
import { useNetworks } from 'hooks/networks/useNetworks'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { useTokenLookup, type TokenInfo } from 'common/hooks/useTokenLookup'
import { tokenLookupResponseKey } from 'common/utils/tokenLookup'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { isDefined } from 'common/utils/isDefined'
import Logger from 'utils/Logger'
import { meldContractTokenKey } from '../utils'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  SOLANA_MELD_CHAIN_ID
} from '../consts'
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
  scopedChainIds: number[]
): MeldTokenCandidate | undefined => {
  const { contractAddress, chainId } = crypto
  if (!contractAddress || !chainId) return undefined

  if (
    contractAddress.toLowerCase() ===
    NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS.toLowerCase()
  ) {
    return undefined
  }

  // Meld reports Solana under its own chain id, not the numeric one the rest of
  // the app keys by.
  const numericChainId =
    chainId === SOLANA_MELD_CHAIN_ID.toString()
      ? ChainId.SOLANA_MAINNET_ID
      : Number(chainId)

  if (!scopedChainIds.includes(numericChainId)) return undefined

  // Parity with the contract-token catalog this replaced: SPL support is
  // deliberately limited to USDC. Widening it is a product decision.
  if (
    numericChainId === ChainId.SOLANA_MAINNET_ID &&
    contractAddress !== tokenAddresses.USDC_SOLANA
  ) {
    return undefined
  }

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

  return candidate.chainId === ChainId.SOLANA_MAINNET_ID
    ? {
        ...shared,
        type: TokenType.SPL,
        contractType: TokenType.SPL,
        caip2Id: candidate.caip2Id
      }
    : { ...shared, type: TokenType.ERC20 }
}

/**
 * Contract tokens for the Meld currencies passed in, keyed by
 * `meldContractTokenKey`.
 *
 * Resolves them with a single batched `/v1/token/lookup` for the handful of
 * currencies Meld actually supports, rather than downloading the full ~53k
 * C-Chain and Ethereum contract-token catalogs to read a few dozen entries out
 * of them.
 */
export const useMeldContractTokenMap = (
  cryptoCurrencies: CryptoCurrency[]
): MeldContractTokenMap => {
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const allCustomTokens = useSelector(selectAllCustomTokens)
  const { allNetworks } = useNetworks()
  const cChainNetwork = useCChainNetwork()
  const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)

  // Matches the chains the catalog hooks covered: the active C-Chain and
  // Ethereum, plus Solana for the single USDC entry.
  const scopedChainIds = useMemo(
    () =>
      [
        cChainNetwork?.chainId,
        ethereumNetwork?.chainId,
        isSolanaSupportBlocked ? undefined : ChainId.SOLANA_MAINNET_ID
      ].filter(isDefined),
    [cChainNetwork?.chainId, ethereumNetwork?.chainId, isSolanaSupportBlocked]
  )

  const candidates = useMemo(
    () =>
      cryptoCurrencies
        .map(crypto => toCandidate(crypto, scopedChainIds))
        .filter(isDefined),
    [cryptoCurrencies, scopedChainIds]
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
    for (const chainId of scopedChainIds) {
      for (const token of allCustomTokens[chainId] ?? []) {
        map.set(meldContractTokenKey(chainId, token.address), token)
      }
    }

    return map
  }, [candidates, lookupTokens, scopedChainIds, allCustomTokens])
}
