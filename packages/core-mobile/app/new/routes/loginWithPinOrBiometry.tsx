import { ScrollScreen } from 'common/components/ScrollScreen'
import React from 'react'
import { PinScreen } from '../common/components/PinScreen'

const LoginWithPinOrBiometry = (): JSX.Element => {
  return (
    <ScrollScreen
      shouldAvoidKeyboard
      hideHeaderBackground
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <PinScreen />
    </ScrollScreen>
  )
}

export default LoginWithPinOrBiometry
