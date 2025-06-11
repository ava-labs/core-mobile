import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useActiveWalletId } from 'common/hooks/useActiveWallet'
import { useRouter } from 'expo-router'
import React from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'

const VerifyChangePinScreen = (): React.JSX.Element => {
  const { replace } = useRouter()
  const walletId = useActiveWalletId()

  const handleVerifySuccess = async (): Promise<void> => {
    const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
    if (!walletSecret) {
      throw new Error('Failed to load wallet secret')
    }
    replace({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/changePin',
      params: { mnemonic: walletSecret }
    })
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleVerifySuccess} />
}
export default VerifyChangePinScreen
