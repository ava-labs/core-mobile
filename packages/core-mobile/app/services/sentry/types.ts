/**
 * Keeps track of all possible transaction names
 */
export type SpanName =
  | 'get-balances'
  | 'get-nft'
  | 'get-nfts'
  | 'send-token'
  | 'send-nft'
  | 'sign-transaction'
  | 'send-transaction'

/**
 * Keeps track of all possible op names
 */
export type OpName =
  | 'svc.balance.get_for_accounts'
  | 'svc.balance.btc.get'
  | 'svc.balance.get'
  | 'svc.balance.glacier.get'
  | 'svc.network.send_transaction'
  | 'svc.nft.get_provider'
  | 'svc.nft.fetchNfts'
  | 'svc.nft.fetchNft'
  | 'svc.send.send'
  | 'svc.send.btc.get_trx_request'
  | 'svc.send.btc.validate_and_calc_fees'
  | 'svc.send.evm.validate_and_calc_fees'
  | 'svc.send.evm.get_trx_request'
  | 'svc.send.pvm.validate_and_calc_fees'
  | 'svc.send.pvm.get_trx_request'
  | 'svc.wallet.sign'
  | 'svc.wallet.get_wallet'
  | 'svc.send.avm.get_trx_request'
  | 'svc.send.avm.validate_and_calc_fees'

export const SentryStorage = 'sentry_sample_rate'

export const SentryTag = {
  FusionSdk: 'fusion-sdk',
  AccountService: 'accounts-service',
  PostHog: 'posthog',
  Glacier: 'glacier',
  ProfileApi: 'profile-api',
  GasStation: 'gas-station',
  Proxy: 'proxy',
  SchemaMigration: 'schemaMigration'
} as const

/**
 * Breadcrumb categories explicitly allowed by `SentryService.beforeBreadcrumb`.
 * `SentryService` derives its allowlist from `Object.values(...)` of this
 * object at module load, so adding a new entry here is enough — no other
 * file needs to change. Breadcrumbs whose category isn't listed get dropped.
 */
export const AllowedSentryBreadcrumbCategory = {
  ListenerMigration: 'listenerMigration',
  ListenerReconciler: 'listenerReconciler',
  FeeEstimationUserState: 'feeEstimationUserState'
} as const

export type AllowedSentryBreadcrumbCategory =
  typeof AllowedSentryBreadcrumbCategory[keyof typeof AllowedSentryBreadcrumbCategory]
