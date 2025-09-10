import { Platform } from 'react-native'

export enum StorageKey {
  SECURE_ACCESS_SET = 'secureAccessSet',
  POSTHOG_SUSPENDED = 'POSTHOG_SUSPENDED',
  HAS_MIGRATED_FROM_ASYNC_STORAGE = 'hasMigratedFromAsyncStorage',
  NOTIFICATIONS_OPTIMIZATION = 'NOTIFICATIONS_OPTIMIZATION',
  LAST_TRANSACTED_ERC20_NETWORKS = 'lastTransactedErc20Networks',
  ADDRESSES_IN_RANGE = 'addressesInRange',
  USER_UNIQUE_ID = 'USER_UNIQUE_ID',
  LAST_SEEN_UPDATE_APP_VERSION = 'LAST_SEEN_UPDATE_APP_VERSION'
}

export enum ZustandStorageKeys {
  RECENT_ACCOUNTS = 'recentAccounts',
  ACTIVITY = 'activity'
}

export const CORE_UNIVERSAL_LINK_HOSTS = ['core.app', 'test.core.app']

export const TERMS_OF_USE_URL = 'https://core.app/terms/core'

export const PRIVACY_POLICY_URL = 'https://www.avalabs.org/privacy-policy'

export const HELP_URL = 'https://support.core.app/en/'

export const DOCS_STAKING_URL =
  'https://support.core.app/en/articles/7950590-core-mobile-how-do-i-use-stake'

export const DOCS_BRIDGE_FAQS_URL =
  'https://support.avax.network/en/articles/6092559-avalanche-bridge-faq'

export const BUNDLE_ID_IOS = 'org.avalabs.corewallet'
export const BUNDLE_ID_ANDROID = 'com.avaxwallet'
export const BUNDLE_ID = Platform.select({
  ios: BUNDLE_ID_IOS,
  android: BUNDLE_ID_ANDROID
})

export const APP_STORE_ID = '6443685999'
export const APP_STORE_URI = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}`
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`

export const PLAY_STORE_URI = `market://details?id=${BUNDLE_ID_ANDROID}`
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${BUNDLE_ID_ANDROID}`
