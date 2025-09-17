import { ScrollScreen } from 'common/components/ScrollScreen'
import React from 'react'
import { useRouter } from 'expo-router'
import { PinScreen } from '../common/components/PinScreen'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const router = useRouter()

  const handleForgotPin = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/forgotPin')
  }

  return (
    <ScrollScreen
      shouldAvoidKeyboard
      hideHeaderBackground
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <PinScreen onForgotPin={handleForgotPin} />
    </ScrollScreen>
  )
}

export default LoginWithPinOrBiometry
