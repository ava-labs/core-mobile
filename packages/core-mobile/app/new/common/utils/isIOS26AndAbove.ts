import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

export const isIOS26AndAbove =
  parseInt(DeviceInfo.getSystemVersion().split('.')[0] || '') >= 26 &&
  Platform.OS === 'ios'
