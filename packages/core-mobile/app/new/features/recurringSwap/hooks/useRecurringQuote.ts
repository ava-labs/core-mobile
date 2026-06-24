import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { RecurringQuoteResponse } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import type { LocalTokenWithBalance } from 'store/balance'
import FusionService from 'features/swap/services/FusionService'
import { useIsFusionServiceReady } from 'features/swap/hooks/useZustandStore'
import type { Frequency, NumberOfOrders } from '../types'
import { resolveRecurringTokenAddress } from '../types'

type Params = {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  amountPerOrder: bigint | undefined
  numberOfOrders: NumberOfOrders | undefined
  frequency: Frequency | undefined
  slippageBps?: number
}

/** Primitive shape of the recurring-quote queryKey — exposed so callers
 *  outside the hook (e.g. `submitRecurringSwap`) can build the *exact* key
 *  for targeted invalidations instead of the broad prefix `[RECURRING_QUOTE]`
 *  that nukes every cached recurring quote. */
export type RecurringQuoteKeyParts = {
  fromTokenNetworkChainId: number | undefined
  fromTokenLocalId: string | undefined
  toTokenNetworkChainId: number | undefined
  toTokenLocalId: string | undefined
  amountPerOrder: bigint | undefined
  numberOfOrders: NumberOfOrders | undefined
  frequency: Frequency | undefined
  slippageBps?: number
}

/** Single source of truth for the queryKey shape so the hook and any
 *  external invalidators stay in lockstep. */
export function buildRecurringQuoteQueryKey(
  parts: RecurringQuoteKeyParts
): readonly unknown[] {
  return [
    ReactQueryKeys.RECURRING_QUOTE,
    parts.fromTokenNetworkChainId,
    parts.fromTokenLocalId,
    parts.toTokenNetworkChainId,
    parts.toTokenLocalId,
    parts.amountPerOrder?.toString(),
    parts.numberOfOrders === undefined
      ? undefined
      : parts.numberOfOrders.toString(),
    parts.frequency?.unit,
    parts.frequency?.value,
    parts.slippageBps
  ]
}

const STALE_MS = 30_000

/**
 * React Query wrapper around `FusionService.markrRecurring.quote(...)`.
 *
 * Query key intentionally keys on *stable primitive* sub-fields (networkChainId,
 * localId, frequency.unit/value) rather than the whole token objects — the swap
 * zustand store hands back new references on unrelated field changes, which
 * would otherwise refetch the quote on every render.
 */
export function useRecurringQuote(
  params: Params
): UseQueryResult<RecurringQuoteResponse, Error> {
  const [isFusionServiceReady] = useIsFusionServiceReady()

  // Usable iff the shared resolver yields an on-chain address: native tokens
  // (zero sentinel) and ERC-20s (their `address`). Everything else — BTC,
  // NFTs, SPL — resolves to `null` and stays disabled. Delegating to
  // `resolveRecurringTokenAddress` keeps this gate in lockstep with the
  // queryFn's address resolution, so an SPL token (non-empty Solana
  // `address`) can't slip past the gate and then resolve to `''`.
  const isUsable = (t: LocalTokenWithBalance | undefined): boolean =>
    !!t && resolveRecurringTokenAddress(t) !== null

  const enabled =
    isFusionServiceReady &&
    isUsable(params.fromToken) &&
    isUsable(params.toToken) &&
    !!params.amountPerOrder &&
    !!params.numberOfOrders &&
    !!params.frequency

  return useQuery<RecurringQuoteResponse>({
    enabled,
    // Both chains keyed even though Markr recurring is same-chain-only
    // today (`RecurringChainInfo` is keyed by a single EVM chainId).
    // `localId` for ERC-20s is just the contract address (no chain
    // embedded), so keying both sides matches `useRecurringEligibility`'s
    // explicit source/target chainId pattern and avoids a latent
    // collision if cross-chain recurring is ever introduced.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- intentional fine-grained queryKey; full `params` object would churn on unrelated swap-store ref changes
    queryKey: buildRecurringQuoteQueryKey({
      fromTokenNetworkChainId: params.fromToken?.networkChainId,
      fromTokenLocalId: params.fromToken?.localId,
      toTokenNetworkChainId: params.toToken?.networkChainId,
      toTokenLocalId: params.toToken?.localId,
      amountPerOrder: params.amountPerOrder,
      numberOfOrders: params.numberOfOrders,
      frequency: params.frequency,
      slippageBps: params.slippageBps
    }),
    staleTime: STALE_MS,
    queryFn: async () => {
      const markrRecurring = FusionService.markrRecurring
      if (!markrRecurring) {
        throw new Error(
          'useRecurringQuote: markrRecurring namespace not available'
        )
      }
      // Re-narrow the params the `enabled` gate already screens. RQ
      // doesn't propagate `enabled`'s narrowing into `queryFn`, so without
      // these guards the body would need non-null assertions on every
      // field. An explicit invariant throw keeps the assumption legible
      // and gives the type-checker something to work with.
      const { fromToken, toToken, amountPerOrder, numberOfOrders, frequency } =
        params
      if (
        fromToken === undefined ||
        toToken === undefined ||
        amountPerOrder === undefined ||
        numberOfOrders === undefined ||
        frequency === undefined
      ) {
        throw new Error(
          'useRecurringQuote: queryFn fired with missing inputs (enabled bypassed?)'
        )
      }
      if (!('decimals' in fromToken) || !('decimals' in toToken))
        throw new Error('Token missing decimals')
      // Native tokens carry `address: ""` on `LocalTokenWithBalance`; the
      // shared resolver substitutes the zero sentinel for natives and
      // returns null for unsupported variants (BTC/NFT/SPL). `enabled` (via
      // `isUsable`, which delegates to the same resolver) already rejects
      // those upstream — so a null here would be a data bug. Throw the same
      // invariant as the guards above rather than coercing to `''` (which
      // would silently feed an empty address into the SDK's zod parse).
      const tokenIn = resolveRecurringTokenAddress(fromToken)
      const tokenOut = resolveRecurringTokenAddress(toToken)
      if (tokenIn === null || tokenOut === null) {
        throw new Error(
          'useRecurringQuote: unsupported token type (enabled bypassed?)'
        )
      }
      return markrRecurring.quote({
        chainId: fromToken.networkChainId,
        tokenIn: tokenIn as Address,
        tokenInDecimals: fromToken.decimals,
        tokenOut: tokenOut as Address,
        tokenOutDecimals: toToken.decimals,
        amount: amountPerOrder,
        numberOfOrders,
        frequency,
        slippage: params.slippageBps
      })
    }
  })
}
