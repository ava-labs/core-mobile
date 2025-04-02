import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const BiometricVerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    BiometricsSDK.storeWalletWithBiometry(mnemonic)
      .then(() => canGoBack() && back())
      .catch(Logger.error)
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}
export default BiometricVerifyPinScreen
