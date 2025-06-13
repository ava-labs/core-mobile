import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import { useActiveWalletId } from 'common/hooks/useActiveWallet'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const walletId = useActiveWalletId()

  const handleVerifySuccess = async (): Promise<void> => {
    try {
      const result = await BiometricsSDK.loadWalletSecret(walletId)
      if (!result.success) {
        throw result.error
      }
      const walletSecret = result.value
      Logger.info('walletSecret', walletSecret)

      replace({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/showRecoveryPhrase',
        params: { mnemonic: walletSecret }
      })
    } catch (err) {
      Logger.error('Error loading wallet secret', err)
    }
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleVerifySuccess} />
}

export default RecoveryPhraseVerifyPinScreen
