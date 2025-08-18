import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import React, { useCallback } from 'react'

export const SetWalletName = ({
  name,
  setName,
  onNext
}: {
  name: string
  setName: (value: string) => void
  onNext: () => void
}): React.JSX.Element => {
  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={onNext}
        disabled={name.length === 0}>
        Next
      </Button>
    )
  }, [name, onNext])

  return (
    <ScrollScreen
      shouldAvoidKeyboard
      disableStickyFooter
      showNavigationHeaderTitle={false}
      title="Add a name for your wallet"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          marginTop: 24,
          marginBottom: 16
        }}>
        <SimpleTextInput
          testID="name_text_input"
          autoFocus
          value={name}
          onChangeText={setName}
        />
      </View>
    </ScrollScreen>
  )
}
