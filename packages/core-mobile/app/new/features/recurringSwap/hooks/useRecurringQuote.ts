import { useQuery } from '@tanstack/react-query'
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
export function useRecurringQuote(params: Params) {
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
      params.fromToken?.networkChainId,
      params.fromToken?.localId,
      params.toToken?.localId,
      params.amountPerOrder?.toString(),
      params.numberOfOrders,
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
      const from = params.fromToken!
      const to = params.toToken!
      if (!('decimals' in from) || !('decimals' in to))
        throw new Error('Token missing decimals')
      // Native tokens carry `address: ""` on `LocalTokenWithBalance`; the
      // shared resolver substitutes the zero sentinel for natives and
      // returns null for unsupported variants (BTC/NFT/SPL) — `enabled`
      // already rejects those upstream, so an empty string here would
      // be a data bug and the SDK's zod parse will reject it.
      const tokenIn = resolveRecurringTokenAddress(from) ?? ''
      const tokenOut = resolveRecurringTokenAddress(to) ?? ''
      return markrRecurring.quote({
        chainId: from.networkChainId,
        tokenIn: tokenIn as Address,
        tokenInDecimals: from.decimals,
        tokenOut: tokenOut as Address,
        tokenOutDecimals: to.decimals,
        amount: params.amountPerOrder!,
        numberOfOrders: params.numberOfOrders!,
        frequency: params.frequency!,
        slippage: params.slippageBps
      })
    }
  })
}
