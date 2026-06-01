import { useQuery } from '@tanstack/react-query'
import type { LocalTokenWithBalance } from 'store/balance'
import { MARKR_EVM_PARTNER_ID } from 'features/swap/consts'
import { getRecurringSwapService } from '../services/RecurringSwapService.singleton'
import type { Frequency, NumberOfOrders } from '../types'

type Params = {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
  amountPerOrder: bigint | undefined
  numberOfOrders: NumberOfOrders | undefined
  frequency: Frequency | undefined
  slippageBps?: number
}

/**
 * EVM/SPL tokens that have both an `address` and `decimals` fields.
 * The runtime guards check both `address` and `decimals` before this cast,
 * eliminating NFT/native variants.
 */
type AddressableToken = LocalTokenWithBalance & { address: string; decimals: number }

const STALE_MS = 30_000

export function useRecurringQuote(params: Params) {
  const fromHasAddress = 'address' in (params.fromToken ?? {})
  const toHasAddress = 'address' in (params.toToken ?? {})

  const enabled =
    !!params.fromToken &&
    !!params.toToken &&
    !!params.amountPerOrder &&
    !!params.numberOfOrders &&
    !!params.frequency &&
    fromHasAddress &&
    toHasAddress

  return useQuery({
    enabled,
    queryKey: [
      'recurringQuote',
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
      const from = params.fromToken!
      const to = params.toToken!
      if (!('address' in from) || !('decimals' in from))
        throw new Error(
          'fromToken missing address/decimals (native/BTC/NFT not supported for recurring)'
        )
      if (!('address' in to) || !('decimals' in to))
        throw new Error('toToken missing address/decimals')
      const fromEvm = from as AddressableToken
      const toEvm = to as AddressableToken
      return getRecurringSwapService().recurringQuote({
        appId: MARKR_EVM_PARTNER_ID,
        chainId: fromEvm.networkChainId,
        tokenIn: fromEvm.address,
        tokenInDecimals: fromEvm.decimals,
        tokenOut: toEvm.address,
        tokenOutDecimals: toEvm.decimals,
        amount: params.amountPerOrder!.toString(),
        numberOfOrders: params.numberOfOrders!,
        frequency: params.frequency!,
        slippageBps: params.slippageBps
      })
    }
  })
}
