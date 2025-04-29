import { VerifyWithPinOrBiometry } from 'common/components/VerifyWithPinOrBiometry'
import { useRouter } from 'expo-router'
import React from 'react'

const VerifyChangePinScreen = (): React.JSX.Element => {
  const { replace } = useRouter()

  const handleLoginSuccess = (mnemonic: string): void => {
    // @ts-ignore TODO: make routes typesafe
    replace({ pathname: '/accountSettings/changePin', params: { mnemonic } })
  }

  return <VerifyWithPinOrBiometry onLoginSuccess={handleLoginSuccess} />
}
export default VerifyChangePinScreen
