import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { selectActiveWallet } from 'store/wallet/slice'
import { useSelector } from 'react-redux'

const BiometricVerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()

  const activeWallet = useSelector(selectActiveWallet)

  const handleLoginSuccess = (mnemonic: string): void => {
    if (activeWallet?.id) {
      BiometricsSDK.storeWalletWithBiometry(activeWallet.id, mnemonic)
        .then(() => canGoBack() && back())
        .catch(Logger.error)
    }
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}
export default BiometricVerifyPinScreen
