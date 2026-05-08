/** Keys read/written on `commonStorage`. */
export enum CommonStorageKeys {
  SECURE_ACCESS_SET = 'secureAccessSet',
  POSTHOG_SUSPENDED = 'POSTHOG_SUSPENDED',
  NOTIFICATIONS_OPTIMIZATION = 'NOTIFICATIONS_OPTIMIZATION',
  USER_UNIQUE_ID = 'USER_UNIQUE_ID',
  LAST_SEEN_UPDATE_APP_VERSION = 'LAST_SEEN_UPDATE_APP_VERSION',
  MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS = 'MIGRATED_ACTIVE_ACCOUNTS_WALLET_IDS',
  INJECTED_PROVIDER_UUID = 'INJECTED_PROVIDER_UUID'
}

/** Keys read/written on `migrationStorage`. */
export enum MigrationStorageKeys {
  LISTENER_MIGRATIONS_STATE = 'LISTENER_MIGRATIONS_STATE'
}

/**
 * Keys used by Zustand stores via the `persist` middleware backed by
 * `zustandPersistStorage`.
 */
export enum ZustandStorageKeys {
  RECENT_ACCOUNTS = 'recentAccounts',
  ACTIVITY = 'activity',
  BORROW_PROTOCOL = 'borrowProtocol',
  PORTFOLIO_VIEW = 'portfolioView',
  COLLECTIBLES_VIEW = 'collectiblesView',
  DEFI_VIEW = 'defiView',
  MARKET_VIEW = 'marketView',
  FAVORITES_VIEW = 'favoritesView',
  TRACK_SEARCH_VIEW = 'trackSearchView',
  LEDGER_WALLET_MAP = 'ledgerWalletMap',
  APP_REVIEW = 'appReview',
  FUSION_TRANSFERS = 'fusionTransfers'
}
