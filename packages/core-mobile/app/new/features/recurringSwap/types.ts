// Frequency units accepted by Markr's /recurring/quote and the wheel-picker UI.
export const FREQUENCY_UNITS = ['minute', 'hour', 'day', 'week', 'month'] as const
export type FrequencyUnit = (typeof FREQUENCY_UNITS)[number]

export type Frequency = {
  unit: FrequencyUnit
  value: number // integer >= 1
}

// Sentinel for the "Unlimited" picker option. Stored in context as `Infinity`;
// mapped to 365 (the Markr cap) at submit time. Keep this in one place so the
// service is the only thing that knows about the deception.
export const UNLIMITED_ORDERS: number = Infinity
export type NumberOfOrders = number | typeof UNLIMITED_ORDERS

// Lifecycle states defined by Markr (see RecurringOrder.status in OpenAPI v2.0.0).
export type ScheduleStatus = 'active' | 'completed' | 'cancelled' | 'paused'

// Mirrors RecurringOrderFailure from the Markr API.
export type ScheduleFailure = {
  executionIndex: number // 1-based index of the failed scheduled swap
  reasons: string[] // e.g. "Slippage tolerance exceeded"
  tryCount: number // on-chain attempts before marked failed
  failedAt: number // unix seconds
}

// Direct mirror of Markr's RecurringOrder. The mobile app stores nothing
// schedule-related in Redux; this type travels via React Query cache only.
// Token symbols/decimals are NOT on the server response — they are joined
// client-side from the active token list when rendering the schedules screen.
// We keep the wire shape narrow and let presentation hydrate.
export type Schedule = {
  orderId: string // bytes32 hex, used as the cancel path param
  owner: string // EVM address that created the schedule
  chainId: number
  tokenIn: string // EVM address
  tokenOut: string // EVM address
  amount: string // per-order input, smallest-unit decimal string
  numberOfOrders: number
  executedOrders: number
  remainingOrders: number // numberOfOrders - executedOrders
  frequency: Frequency
  totalAmountIn: string // amount × numberOfOrders
  tryCount: number // retry count for the NEXT execution (0 if none pending)
  failures: ScheduleFailure[] // history of failed indices (newest last)
  status: ScheduleStatus
  createdAt: number // unix seconds
  nextExecutionAt: number | null
  cancelledAt?: number | null
}

// Schedule preview used to populate the ApprovalScreen's recurrence block
// before the order exists server-side. This is purely client-side state held
// in RecurringSwapContext between quote + first-fill confirmation.
export type SchedulePreview = {
  chainId: number
  fromTokenAddress: string
  fromTokenSymbol: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenSymbol: string
  toTokenDecimals: number
  amountPerOrder: string
  numberOfOrders: number // 365 if user picked Unlimited
  isUnlimited: boolean
  frequency: Frequency
  intervalSeconds: number
  totalAmountIn: string
  quoteUuid: string // from /recurring/quote
}
