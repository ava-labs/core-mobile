import React from 'react'
import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'

const RecoveryMethodsVerifyPinScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handleLoginSuccess = (): void => {
    replace('./showRecoveryMethods')
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}

export default RecoveryMethodsVerifyPinScreen
