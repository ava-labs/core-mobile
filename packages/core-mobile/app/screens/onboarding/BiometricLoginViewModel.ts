import { useEffect, useState, useCallback } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { UserCredentials } from 'react-native-keychain'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'

interface BiometricLoginTypes {
  biometryType: string
  storeMnemonicWithBiometric: () => Promise<boolean | UserCredentials>
}

export function useBiometricLogin(m: string): BiometricLoginTypes {
  const [mnemonic] = useState(m)
  const [biometryType, setBiometryType] = useState<string>('')
  const activeWalletId = useSelector(selectActiveWalletId)

  useEffect(() => {
    BiometricsSDK.getBiometryType()
      .then(value => {
        setBiometryType(value?.toString() ?? '')
      })
      .catch(Logger.error)
  }, [])

  const storeMnemonicWithBiometric = useCallback((): Promise<boolean> => {
    if (!activeWalletId) {
      Logger.error('No active wallet ID found')
      return Promise.resolve(false)
    }
    return BiometricsSDK.storeWalletWithBiometry(activeWalletId, mnemonic)
  }, [activeWalletId, mnemonic])

  return { biometryType, storeMnemonicWithBiometric }
}
