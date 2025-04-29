import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    replace({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/showRecoveryPhrase',
      params: { mnemonic }
    })
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default RecoveryPhraseVerifyPinScreen
