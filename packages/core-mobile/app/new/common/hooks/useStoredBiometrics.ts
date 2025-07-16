import { useEffect, useState } from 'react'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { AuthenticationType } from 'expo-local-authentication'

export const useStoredBiometrics = (): {
  /** Whether biometric authentication is currently enabled by the user */
  useBiometrics: boolean
  /** Function to enable/disable biometric authentication */
  setUseBiometrics: React.Dispatch<React.SetStateAction<boolean>>
  /** Whether the device supports biometric authentication */
  isBiometricAvailable: boolean
  /** The type of biometric authentication available on the device (e.g. fingerprint, face) */
  biometricTypes: AuthenticationType[]
} => {
  const [useBiometrics, setUseBiometrics] = useState(true)
  const [biometricTypes, setBiometricTypes] = useState<AuthenticationType[]>([])

  useEffect(() => {
    async function getBiometryTypes(): Promise<void> {
      const authTypes = await BiometricsSDK.getAuthenticationTypes()
      const canUseBiometry = authTypes.length > 0

      if (canUseBiometry) {
        setBiometricTypes(authTypes)
        const type = BiometricsSDK.getAccessType()
        if (type) {
          setUseBiometrics(type === 'BIO')
        } else {
          Logger.error('Secure access type not found')
        }
      }
    }
    getBiometryTypes().catch(Logger.error)
  }, [])

  return {
    useBiometrics,
    setUseBiometrics,
    isBiometricAvailable: biometricTypes.length > 0,
    biometricTypes
  }
}
