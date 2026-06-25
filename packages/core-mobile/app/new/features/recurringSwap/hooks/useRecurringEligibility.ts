import { useMemo } from 'react'
import type { Address } from 'viem'
import { RecurringEligibilityReason } from '@avalabs/fusion-sdk'
import type { RecurringEligibility } from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import FusionService from 'features/swap/services/FusionService'
import { useIsFusionServiceReady } from 'features/swap/hooks/useZustandStore'
import Logger from 'utils/Logger'
import { resolveRecurringTokenAddress } from '../types'

/**
 * Recurring-swap eligibility for a candidate `(fromToken, toToken, owner)` triple.
 *
 * The SDK's `markr.recurring.checkEligibility(...)` is the source of truth — it
 * encodes Markr's cross-chain / unsupported-token / amount-below-minimum rules
 * against the cached `/info/chains` payload. This hook is a thin React adapter:
 *
 * - returns `{ eligible: false, reason: 'unsupported-source-chain' }` while
 *   `FusionService` is initialising (caches not loaded yet); re-renders when
 *   `useIsFusionServiceReady` flips
 * - projects mobile's `LocalTokenWithBalance` shape onto the SDK's `Address`
 *   inputs (the SDK's branded type — cast at the boundary)
 *
 * @param amount — per-order input amount in `tokenIn`'s smallest unit. When set,
 *   the SDK additionally surfaces the `amount-below-minimum` reason. UI passes
 *   it from the live input box; pass `undefined` to skip the amount check.
 */
export function useRecurringEligibility(
  fromToken: LocalTokenWithBalance | undefined,
  toToken: LocalTokenWithBalance | undefined,
  ownerAddress: string | undefined,
  amount?: bigint
): RecurringEligibility {
  const [isFusionServiceReady] = useIsFusionServiceReady()

  return useMemo<RecurringEligibility>(() => {
    if (!isFusionServiceReady) {
      // Treat "service not ready yet" as ineligible-via-unsupported-chain so the
      // toggle stays hidden until init resolves. Renders again once ready.
      return {
        eligible: false,
        reason: RecurringEligibilityReason.UnsupportedSourceChain
      }
    }
    const markrRecurring = FusionService.markrRecurring
    if (!markrRecurring) {
      return {
        eligible: false,
        reason: RecurringEligibilityReason.UnsupportedSourceChain
      }
    }
    if (!ownerAddress)
      return {
        eligible: false,
        reason: RecurringEligibilityReason.NoEvmAddress
      }
    if (!fromToken || !toToken)
      return {
        eligible: false,
        reason: RecurringEligibilityReason.UnsupportedToken
      }

    // Resolve the on-chain address. Native tokens get the zero sentinel (the
    // SDK's viem-backed `isAddressEqual` throws on empty strings); anything
    // without a usable address (BTC, NFTs, SPL) is rejected. An ERC-20
    // reaching here without an address would be a data bug — surfaces as
    // `UnsupportedToken` here rather than being silently zeroed.
    const fromTokenAddress = resolveRecurringTokenAddress(fromToken)
    const toTokenAddress = resolveRecurringTokenAddress(toToken)
    if (!fromTokenAddress || !toTokenAddress) {
      return {
        eligible: false,
        reason: RecurringEligibilityReason.UnsupportedToken
      }
    }

    // `manager.recurring` is always present on the namespace object, but its
    // methods throw `ServiceUnavailableError(SERVICE_TYPE_NOT_CONFIGURED)`
    // synchronously when Markr wasn't initialized — currently the case in
    // any non-PROD environment (the SDK gates Markr init to PROD only). We
    // run inside `useMemo` during render, so an uncaught throw crashes the
    // tree — catch it and surface as ineligible so the toggle stays hidden.

    try {
      return markrRecurring.checkEligibility({
        sourceChainId: fromToken.networkChainId,
        targetChainId: toToken.networkChainId,
        // viem's branded Address is structurally a string; safe to cast at the
        // boundary, the SDK validates the address against its chain-info map.
        fromTokenAddress: fromTokenAddress as Address,
        toTokenAddress: toTokenAddress as Address,
        ownerAddress: ownerAddress as Address,
        amount
      })
    } catch (err) {
      Logger.info(
        '[useRecurringEligibility] checkEligibility threw — treating as ineligible',
        String(err)
      )
      return {
        eligible: false,
        reason: RecurringEligibilityReason.UnsupportedSourceChain
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional fine-grained deps; mirrors useRecurringQuote's primitive-keyed queryKey so the memo doesn't churn on unrelated swap-store ref changes
  }, [
    isFusionServiceReady,
    fromToken?.networkChainId,
    fromToken?.localId,
    toToken?.networkChainId,
    toToken?.localId,
    ownerAddress,
    amount
  ])
}
