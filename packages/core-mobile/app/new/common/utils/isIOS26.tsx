import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

export const isIOS26 =
  DeviceInfo.getSystemVersion() >= '26' && Platform.OS === 'ios'
