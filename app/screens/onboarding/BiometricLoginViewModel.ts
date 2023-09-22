import { useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { BIOMETRY_TYPE, UserCredentials } from 'react-native-keychain'
import Logger from 'utils/Logger'
import FingerprintSVG from 'components/svg/FingerprintSVG'
import FaceIdSVG from 'components/svg/FaceIdSVG'

interface BiometricLoginTypes {
  biometryType: string
  storeMnemonicWithBiometric: () => Promise<boolean | UserCredentials>
  fingerprintIcon: Element | undefined
}

export function useBiometricLogin(m: string): BiometricLoginTypes {
  const [mnemonic] = useState(m)
  const [biometryType, setBiometryType] = useState<string>('')
  const [fingerprintIcon, setFingerprintIcon] = useState<Element>()

  useEffect(() => {
    BiometricsSDK.getBiometryType()
      .then(value => {
        setBiometryType(value?.toString() ?? '')
      })
      .catch(reason => Logger.error(reason))
  }, [])

  useEffect(() => {
    switch (biometryType) {
      case BIOMETRY_TYPE.FINGERPRINT:
      case BIOMETRY_TYPE.TOUCH_ID:
        setFingerprintIcon(FingerprintSVG)
        break
      case BIOMETRY_TYPE.FACE:
      case BIOMETRY_TYPE.FACE_ID:
        setFingerprintIcon(FaceIdSVG)
        break
      case BIOMETRY_TYPE.IRIS:
        setFingerprintIcon(FaceIdSVG)
        //todo add correct icon
        break
    }
  }, [biometryType])

  const storeMnemonicWithBiometric = () => {
    return BiometricsSDK.storeWalletWithBiometry(mnemonic)
  }

  return { biometryType, storeMnemonicWithBiometric, fingerprintIcon }
}
