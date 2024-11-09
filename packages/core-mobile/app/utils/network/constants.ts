import { AppName } from '@avalabs/vm-module-types'
import { Platform } from 'react-native'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'

export const AVALANCHE_MAINNET_API_URL = 'https://api.avax.network'
export const AVALANCHE_TESTNET_API_URL = 'https://api.avax-test.network'
export const AVALANCHE_DEVNET_API_URL = 'https://etna.avax-dev.network'

export const APPLICATION_NAME =
  Platform.OS === 'ios' ? AppName.CORE_MOBILE_IOS : AppName.CORE_MOBILE_ANDROID
export const APPLICATION_VERSION = DeviceInfoService.getAppVersion()

export const CORE_HEADERS = {
  'x-application-name': APPLICATION_NAME,
  'x-application-version': APPLICATION_VERSION
}
