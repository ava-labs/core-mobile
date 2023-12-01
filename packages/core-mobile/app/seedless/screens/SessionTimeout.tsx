import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import TimerSVG from 'components/svg/TimerSVG'
import FlexSpacer from 'components/FlexSpacer'

export type SessionTimeoutParams = {
  onRetry: () => void
}
export default function SessionTimeout({
  onRetry
}: SessionTimeoutParams): JSX.Element {
  return (
    <View style={{ padding: 16, flex: 1 }}>
      <FlexSpacer />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 30 }}>
        <TimerSVG />
        <Space y={24} />
        <AvaText.Heading5>Your Session has Timed Out</AvaText.Heading5>
        <Space y={8} />
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          The session has expired, press Retry to continue.
        </AvaText.Body2>
      </View>
      <FlexSpacer />
      <AvaButton.PrimaryLarge onPress={onRetry} style={{ width: '100%' }}>
        Retry
      </AvaButton.PrimaryLarge>
    </View>
  )
}
