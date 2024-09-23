import { Platform } from 'react-native'

export const AVALANCHE_MAINNET_API_URL = 'https://api.avax.network'
export const AVALANCHE_TESTNET_API_URL = 'https://api.avax-test.network'

export const X_APPLICATION_NAME =
  Platform.OS === 'ios' ? 'core-mobile-ios' : 'core-mobile-android'
export const X_APPLICATION_VERSION = '1.1'

export const DEAFULT_HEADERS = {
  'x-application-name': X_APPLICATION_NAME,
  'x-application-version': X_APPLICATION_VERSION
}
