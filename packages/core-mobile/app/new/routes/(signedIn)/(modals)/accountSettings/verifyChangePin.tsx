import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useActiveWalletId } from 'common/hooks/useActiveWallet'
import { useRouter } from 'expo-router'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const VerifyChangePinScreen = (): React.JSX.Element => {
  const { replace } = useRouter()
  const walletId = useActiveWalletId()

  const handleVerifySuccess = async (): Promise<void> => {
    const walletSecretResult = await BiometricsSDK.loadWalletSecret(walletId)
    if (!walletSecretResult.success) {
      Logger.error('Failed to load wallet secret', walletSecretResult.error)
      return
    }

    replace({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/changePin',
      params: { mnemonic: walletSecretResult.value }
    })
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleVerifySuccess} />
}
export default VerifyChangePinScreen
