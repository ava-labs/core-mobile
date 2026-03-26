export type KycStatus = 'idle' | 'pending' | 'approved' | 'rejected'

/**
 * Minimal market shape stored in Redux.
 * Full SDK type (TradableMarket) is used in React Query hooks — this is just
 * enough to drive the tab badge count and cross-screen navigation.
 */
export type MarketSummary = {
  tickerId: string
  title: string
}
