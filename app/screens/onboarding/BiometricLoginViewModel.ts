import { useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { UserCredentials } from 'react-native-keychain'
import Logger from 'utils/Logger'

interface BiometricLoginTypes {
  biometryType: string
  storeMnemonicWithBiometric: () => Promise<boolean | UserCredentials>
}

export function useBiometricLogin(m: string): BiometricLoginTypes {
  const [mnemonic] = useState(m)
  const [biometryType, setBiometryType] = useState<string>('')

  useEffect(() => {
    BiometricsSDK.getBiometryType()
      .then(value => {
        setBiometryType(value?.toString() ?? '')
      })
      .catch(reason => Logger.error(reason))
  }, [])

  const storeMnemonicWithBiometric = () => {
    return BiometricsSDK.storeWalletWithBiometry(mnemonic)
  }

  return { biometryType, storeMnemonicWithBiometric }
}
