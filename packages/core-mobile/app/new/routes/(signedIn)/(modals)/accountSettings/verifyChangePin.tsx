import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import React from 'react'

const VerifyChangePinScreen = (): React.JSX.Element => {
  const { replace } = useRouter()

  const handleVerifySuccess = async (): Promise<void> => {
    // @ts-ignore TODO: make routes typesafe
    replace('/accountSettings/changePin')
  }

  return <VerifyWithPinOrBiometry onVerifySuccess={handleVerifySuccess} />
}
export default VerifyChangePinScreen
