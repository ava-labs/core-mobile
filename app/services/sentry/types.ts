/**
 * Keeps track of all possible transaction names
 */
export type TransactionName =
  | 'get-balances'
  | 'get-nfts'
  | 'send-erc20'
  | 'send-erc721'
  | 'swap'

export const SentryStorage = 'sentry_sample_rate'
