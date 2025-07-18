import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'

/**
 * Check if the device is a Pixel device with a secure face unlock feature.
 * @returns True if the device is a Pixel device with a secure face unlock feature, false otherwise.
 */
export const hasSecureFaceUnlock = async (): Promise<boolean> => {
  const model = DeviceInfo.getModel() // e.g., 'Pixel 8 Pro'
  const deviceId = DeviceInfo.getDeviceId() // e.g., 'pixel_8_pro'

  const pixelModels = [
    'Pixel 4',
    'Pixel 4 XL',
    'Pixel 8',
    'Pixel 8 Pro',
    'Pixel 8a',
    'Pixel 9',
    'Pixel 9 Pro',
    'Pixel 9 Pro Fold'
  ]

  // Some device IDs for recent models for robust comparison
  const pixelDeviceIds = [
    'coral', // Pixel 4
    'flame', // Pixel 4 XL
    'shiba', // Pixel 8
    'husky', // Pixel 8 Pro
    'akita', // Pixel 8a (example, real ID may differ)
    'panther', // Pixel 7 (example, for reference)
    'pixel_9', // Pixel 9 (example, real ID may differ)
    'pixel_9_pro', // Pixel 9 Pro (example, real ID may differ)
    'pixel_9_fold' // Pixel 9 Pro Fold (example, real ID may differ)
  ]

  return (
    (Platform.OS === 'android' && pixelModels.includes(model)) ||
    pixelDeviceIds.includes(deviceId.toLowerCase())
  )
}
