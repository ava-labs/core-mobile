import { getDeviceNameSync } from 'react-native-device-info'

export const isIphoneSE = (): boolean => {
  const deviceName = getDeviceNameSync()
  return deviceName.toLowerCase().includes('iphone se')
}
