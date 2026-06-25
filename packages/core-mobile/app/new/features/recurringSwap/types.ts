import {
  RECURRING_FREQUENCY_UNITS,
  RecurringOrderStatus,
  // Mobile's `LocalTokenWithBalance` shape has `address: string` on every
  // variant, but the value is `""` for native tokens (AVAX, ETH). Recurring
  // callers substitute the zero address at the boundary so viem's
  // `isAddressEqual` (eligibility) and the SDK's wire-shape zod parse
  // (quote / submit) don't choke on the empty string. Re-export the SDK's
  // own `ERC_ZERO_ADDRESS` under the recurring-feature alias so the literal
  // only lives in one place (the SDK).
  ERC_ZERO_ADDRESS
} from '@avalabs/fusion-sdk'
import type {
  RecurringFrequency,
  RecurringFrequencyUnit,
  RecurringOrder,
  RecurringOrderFailure
} from '@avalabs/fusion-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'

// Re-export the SDK's frequency-unit constant under the legacy name so picker
// code can iterate it as a value (not just a type).
export const FREQUENCY_UNITS = RECURRING_FREQUENCY_UNITS

// Re-export the SDK's recurring domain types/enums so feature code can import
// from one place. `RecurringOrderStatus` is the enum value (PascalCase members
// → kebab/lowercase wire values), so it must be re-exported as a value, not a
// type — UI sites use `RecurringOrderStatus.Active` etc. instead of the
// stringly-typed literals so a future Markr status addition is caught at
// schema-parse time.
export { RecurringOrderStatus }
export type {
  RecurringFrequency,
  RecurringFrequencyUnit,
  RecurringOrder,
  RecurringOrderFailure
}
export type Frequency = RecurringFrequency
export type FrequencyUnit = RecurringFrequencyUnit
export type Schedule = RecurringOrder
export type ScheduleStatus = RecurringOrderStatus
export type ScheduleFailure = RecurringOrderFailure

// Sentinel for the "Unlimited" picker option. Stored in context as `Infinity`;
// the SDK's `quote()` translates it to `-1` (Markr's wire sentinel for uint256
// max on-chain) at the API boundary. Keep this exported so the picker can use
// it as a discriminator without re-importing from Infinity.
export const UNLIMITED_ORDERS = Infinity
export type NumberOfOrders = number | typeof UNLIMITED_ORDERS

/**
 * Resolves a `LocalTokenWithBalance` to the on-chain address recurring callers
 * pass to the SDK. Native tokens get the zero sentinel; ERC-20s return their
 * `address`. Returns `null` for anything else (BTC, NFTs, SPL — no usable
 * EVM address) so the caller can map to an "unsupported token" outcome.
 *
 * Shared between `useRecurringEligibility` and `useRecurringQuote` so the
 * native/ERC-20 substitution lives in one place.
 */
export function resolveRecurringTokenAddress(
  token: LocalTokenWithBalance
): string | null {
  if (token.type === TokenType.NATIVE) return ERC_ZERO_ADDRESS
  if (token.type === TokenType.ERC20 && 'address' in token && token.address)
    return token.address
  return null
}

// Pure UI / context shape: carries display-ready strings (tokenSymbol, decimals)
// that the SDK's wire types don't include. Lives in the RecurringSwapContext
// between quote + first-fill confirmation and is what gets stuffed into the
// ApprovalController `RequestContext.RECURRING_SWAP` slot.
//
// Stays in mobile — it's not part of the Markr wire format.
export type SchedulePreview = {
  chainId: number
  fromTokenAddress: string
  fromTokenSymbol: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenSymbol: string
  toTokenDecimals: number
  amountPerOrder: string
  // Wire value Markr signs: `RECURRING_UNLIMITED_ORDERS_SENTINEL` (`-1`)
  // if the user picked Unlimited, else a finite count. Consumers derive
  // "unlimited?" from this sentinel — no separate boolean field.
  numberOfOrders: number
  frequency: RecurringFrequency
  intervalSeconds: number
  totalAmountIn: string
  quoteUuid: string // from POST /recurring/quote
}
