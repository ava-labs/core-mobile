import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import { useActiveWalletId } from 'common/hooks/useActiveWallet'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const walletId = useActiveWalletId()

  const handleVerifySuccess = (): void => {
    BiometricsSDK.loadWalletSecret(walletId)
      .then(walletSecret => {
        Logger.info('walletSecret', walletSecret)
        if (!walletSecret) {
          throw new Error('Failed to load wallet secret')
        }
        replace({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/accountSettings/showRecoveryPhrase',
          params: { mnemonic: walletSecret }
        })
      })
      .catch(err => {
        Logger.error('Error loading wallet secret', err)
      })
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleVerifySuccess} />
}

export default RecoveryPhraseVerifyPinScreen
