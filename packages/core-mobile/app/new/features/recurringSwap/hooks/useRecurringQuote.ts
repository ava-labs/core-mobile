import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { Address } from 'viem'
import { TokenType } from '@avalabs/vm-module-types'
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

const STALE_MS = 30_000

/**
 * Debounced wrapper around `FusionService.markrRecurring.quote(...)`.
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

  // Native tokens are usable (resolved to the zero sentinel in queryFn);
  // ERC-20s need a non-empty `address`. Everything else (NFTs / SPL) stays
  // disabled.
  const isUsable = (t: LocalTokenWithBalance | undefined): boolean =>
    !!t &&
    (t.type === TokenType.NATIVE ||
      ('address' in t && typeof t.address === 'string' && t.address.length > 0))

  const enabled =
    isFusionServiceReady &&
    isUsable(params.fromToken) &&
    isUsable(params.toToken) &&
    !!params.amountPerOrder &&
    !!params.numberOfOrders &&
    !!params.frequency

  return useQuery<RecurringQuoteResponse>({
    enabled,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- intentional fine-grained queryKey
    queryKey: [
      ReactQueryKeys.RECURRING_QUOTE,
      // Both chains keyed even though Markr recurring is same-chain-only
      // today (`RecurringChainInfo` is keyed by a single EVM chainId).
      // `localId` for ERC-20s is just the contract address (no chain
      // embedded), so keying both sides matches `useRecurringEligibility`'s
      // explicit source/target chainId pattern and avoids a latent
      // collision if cross-chain recurring is ever introduced.
      params.fromToken?.networkChainId,
      params.fromToken?.localId,
      params.toToken?.networkChainId,
      params.toToken?.localId,
      params.amountPerOrder?.toString(),
      params.numberOfOrders === undefined
        ? undefined
        : params.numberOfOrders.toString(),
      params.frequency?.unit,
      params.frequency?.value,
      params.slippageBps
    ],
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
      // returns null for unsupported variants (BTC/NFT/SPL) — `enabled`
      // already rejects those upstream, so an empty string here would
      // be a data bug and the SDK's zod parse will reject it.
      const tokenIn = resolveRecurringTokenAddress(fromToken) ?? ''
      const tokenOut = resolveRecurringTokenAddress(toToken) ?? ''
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
