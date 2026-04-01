import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { StorageKey } from 'resources/Constants'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'
import BiometricsSDK, { BiometricType } from 'utils/BiometricsSDK'
import { selectWalletState } from 'store/app/slice'
import { WalletState } from 'store/app/types'

export const useStoredBiometrics = (): {
  /** Whether biometric authentication is currently enabled by the user */
  useBiometrics: boolean
  /** Function to enable/disable biometric authentication */
  setUseBiometrics: React.Dispatch<React.SetStateAction<boolean>>
  /** Whether the device supports biometric authentication */
  isBiometricAvailable: boolean
  /** The type of biometric authentication available on the device (e.g. fingerprint, face) */
  biometricType: BiometricType
} => {
  const walletState = useSelector(selectWalletState)
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false)
  const [useBiometrics, setUseBiometrics] = useState(true)
  const [biometricType, setBiometricType] = useState<BiometricType>(
    BiometricType.NONE
  )

  useEffect(() => {
    const getBiometryType = async (): Promise<void> => {
      const type = await BiometricsSDK.getBiometryType()
      setBiometricType(type)
    }
    getBiometryType().catch(Logger.error)
    BiometricsSDK.canUseBiometry()
      .then((canUseBiometry: boolean) => {
        setIsBiometricAvailable(canUseBiometry)
      })
      .catch(Logger.error)
  }, [])

  useEffect(() => {
    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type) {
      setUseBiometrics(type === 'BIO')
    } else if (walletState !== WalletState.NONEXISTENT) {
      // key is legitimately absent during onboarding (NONEXISTENT), so only
      // log an error for already-onboarded users where the missing key is unexpected
      Logger.error('Secure access type not found')
    }
  }, [walletState])

  return {
    useBiometrics,
    setUseBiometrics,
    isBiometricAvailable,
    biometricType
  }
}
