import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'

const RecoveryPhraseVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handleLoginSuccess = (): void => {
    replace('./showRecoveryPhrase')
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default RecoveryPhraseVerifyPinScreen
