import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import AvaText from 'components/AvaText'
import { Button, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import SlideToConfirm from 'screens/earn/components/SlideToConfirm'

const ForgotPin = ({ onConfirm }: { onConfirm: () => void }): JSX.Element => {
  const { goBack, canGoBack } = useNavigation()

  const onClose = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
        type="tertiary"
        size="xlarge"
        style={{ marginTop: 16 }}
        onPress={onClose}>
        Cancel
      </Button>
    </View>
  )
}

export default ForgotPin
