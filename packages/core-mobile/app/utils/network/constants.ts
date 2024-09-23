import { AppName } from '@avalabs/vm-module-types'
import { Platform } from 'react-native'

export const AVALANCHE_MAINNET_API_URL = 'https://api.avax.network'
export const AVALANCHE_TESTNET_API_URL = 'https://api.avax-test.network'

export const APPLICATION_NAME =
  Platform.OS === 'ios' ? AppName.CORE_MOBILE_IOS : AppName.CORE_MOBILE_ANDROID
export const APPLICATION_VERSION = '1.1'

export const DEAFULT_HEADERS = {
  'x-application-name': APPLICATION_NAME,
  'x-application-version': APPLICATION_VERSION
}
