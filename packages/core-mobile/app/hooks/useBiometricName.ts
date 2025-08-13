import { AuthenticationType } from 'expo-local-authentication'
import { Platform } from 'react-native'

/**
 * Returns the platform specific name of the biometric type (e.g. Touch ID, Face ID, fingerprint, etc.)
 * @param biometricTypes - The biometric types to identify the name
 * @returns The name of the biometric type
 */
export const useBiometricName = (
  biometricTypes: AuthenticationType[]
): string | undefined => {
  if (biometricTypes.length === 0) {
    return
  }

  if (Platform.OS === 'android') {
    return biometricTypes.length > 1
      ? BiometricName.BIOMETRICS
      : biometricTypes[0] === AuthenticationType.FACIAL_RECOGNITION
      ? BiometricName.FACE_UNLOCK
      : BiometricName.FINGERPRINT
  }

  return biometricTypes[0] === AuthenticationType.FACIAL_RECOGNITION
    ? BiometricName.FACE_ID
    : BiometricName.TOUCH_ID
}

export enum BiometricName {
  FACE_UNLOCK = 'Face Unlock',
  FINGERPRINT = 'Fingerprint',
  FACE_ID = 'Face ID',
  TOUCH_ID = 'Touch ID',
  IRIS = 'Iris',
  BIOMETRICS = 'Biometrics' // for android, if there are multiple biometric types, we simply show Biometrics
}
