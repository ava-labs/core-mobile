import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const BiometricVerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useDebouncedRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    BiometricsSDK.storeWalletWithBiometry(mnemonic)
      .then(() => canGoBack() && back())
      .catch(Logger.error)
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}
export default BiometricVerifyPinScreen
