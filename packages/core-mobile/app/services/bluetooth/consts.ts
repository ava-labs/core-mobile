import { PermissionsAndroid } from 'react-native'

export const ANDROID_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
].filter(Boolean) // Some may be undefined on older Android versions
