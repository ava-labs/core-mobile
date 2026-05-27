// Frequency units accepted by Markr's /recurring/quote and the wheel-picker UI.
export const FREQUENCY_UNITS = ['minute', 'hour', 'day', 'week', 'month'] as const
export type FrequencyUnit = typeof FREQUENCY_UNITS[number]

export type Frequency = {
  unit: FrequencyUnit
  value: number // integer >= 1
}

// Sentinel for the "Unlimited" picker option. Stored in context as `Infinity`;
// mapped to 365 (the Markr cap) at submit time. Keep this in one place so the
// service is the only thing that knows about the deception.
export const UNLIMITED_ORDERS: number = Infinity
export type NumberOfOrders = number | typeof UNLIMITED_ORDERS

export type ScheduleStatus =
  | 'active'
  | 'completed'
  | 'failed_cancelled'   // backend auto-cancelled on slippage / insufficient balance
  | 'user_cancelled'

export type Schedule = {
  uuid: string
  ownerAddress: string         // EVM address that owns the schedule
  chainId: number
  fromTokenAddress: string
  fromTokenSymbol: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenSymbol: string
  toTokenDecimals: number
  amountPerOrder: string       // smallest-unit decimal string
  numberOfOrders: number       // 365 if user picked Unlimited (Markr never sees Infinity)
  isUnlimited: boolean
  frequency: Frequency
  intervalSeconds: number
  ordersExecuted: number
  nextSwapScheduledAt: number | null // unix seconds; null if completed/cancelled
  createdAt: number             // unix seconds
  status: ScheduleStatus
  failureCause?: 'slippage' | 'insufficient_balance' | 'unknown'
}

// Schedule preview used to populate the ApprovalScreen's Recurrence block
// before a uuid exists. Same shape as the persisted Schedule minus the
// server-assigned fields.
export type SchedulePreview = Omit<
  Schedule,
  'uuid' | 'ordersExecuted' | 'nextSwapScheduledAt' | 'createdAt' | 'status' | 'failureCause'
>
