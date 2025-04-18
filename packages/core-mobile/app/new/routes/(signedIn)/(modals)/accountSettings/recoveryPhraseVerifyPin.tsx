import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    replace({ pathname: './showRecoveryPhrase', params: { mnemonic } })
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default RecoveryPhraseVerifyPinScreen
