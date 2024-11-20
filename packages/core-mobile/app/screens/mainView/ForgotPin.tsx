import React from 'react'
import AvaText from 'components/AvaText'
import { Button, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import SlideToConfirm from 'screens/earn/components/SlideToConfirm'

const ForgotPin = ({
  onConfirm,
  onCancel
}: {
  onConfirm: () => void
  onCancel: () => void
}): JSX.Element => {
  return (
    <View style={{ padding: 16, height: '100%' }}>
      <AvaText.LargeTitleBold>
        {`Do you want to\nreset your PIN?`}
      </AvaText.LargeTitleBold>
      <Space y={5} />
      <AvaText.Body1>
        If you continue, the current wallet session will be terminated and you
        will need to recover your wallet using a social login or recovery
        phrase.
      </AvaText.Body1>
      <FlexSpacer />
      <SlideToConfirm onConfirm={onConfirm} text={'Slide to confirm'} />
      <Button
        testID="cancel_btn"
        type="tertiary"
        size="xlarge"
        style={{ marginTop: 16 }}
        onPress={onCancel}>
        Cancel
      </Button>
    </View>
  )
}

export default ForgotPin
