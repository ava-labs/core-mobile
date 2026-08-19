import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NetworkContractToken } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { tokenAddresses } from 'consts/tokenIds'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSolanaTokens } from 'common/hooks/useSolanaTokens'
import { meldContractTokenKey } from '../utils'

type MeldContractTokenMap = Map<string, NetworkContractToken>

type CacheEntry = {
  erc20ContractTokens: NetworkContractToken[]
  solanaTokens: NetworkContractToken[]
  isSolanaSupportBlocked: boolean
  map: MeldContractTokenMap
}

// Cached at module scope rather than per-hook: the amount screen mounts three
// useMeldTokenWithBalance consumers at once, and a per-instance useMemo would
// build (and retain) a separate ~57k-entry map for each of them. Both token
// hooks return references that are stable across balance polls, so a
// single-entry reference check is enough to keep this at one build per catalog
// refresh.
let cache: CacheEntry | undefined

const buildMap = (
  erc20ContractTokens: NetworkContractToken[],
  solanaTokens: NetworkContractToken[],
  isSolanaSupportBlocked: boolean
): MeldContractTokenMap => {
  if (
    cache !== undefined &&
    cache.erc20ContractTokens === erc20ContractTokens &&
    cache.solanaTokens === solanaTokens &&
    cache.isSolanaSupportBlocked === isSolanaSupportBlocked
  ) {
    return cache.map
  }

  const map: MeldContractTokenMap = new Map()
  for (const token of erc20ContractTokens) {
    if ('chainId' in token && token.chainId && token.address) {
      map.set(meldContractTokenKey(token.chainId, token.address), token)
    }
  }
  // Solana stubs are deliberately restricted to USDC_SOLANA — widening SPL
  // support is a product decision, not a perf fix.
  const usdcSolana = isSolanaSupportBlocked
    ? undefined
    : solanaTokens.find(
        token =>
          'chainId' in token &&
          token.chainId === ChainId.SOLANA_MAINNET_ID &&
          token.address === tokenAddresses.USDC_SOLANA
      )
  if (usdcSolana) {
    map.set(
      meldContractTokenKey(ChainId.SOLANA_MAINNET_ID, usdcSolana.address),
      usdcSolana
    )
  }

  cache = {
    erc20ContractTokens,
    solanaTokens,
    isSolanaSupportBlocked,
    map
  }
  return map
}

/**
 * Contract tokens keyed by `meldContractTokenKey` so a Meld currency resolves
 * with a single map hit instead of a scan over the ~57k-entry catalog.
 */
export const useMeldContractTokenMap = (): MeldContractTokenMap => {
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const erc20ContractTokens = useErc20ContractTokens()
  const solanaTokens = useSolanaTokens()

  return useMemo(
    () => buildMap(erc20ContractTokens, solanaTokens, isSolanaSupportBlocked),
    [erc20ContractTokens, solanaTokens, isSolanaSupportBlocked]
  )
}
