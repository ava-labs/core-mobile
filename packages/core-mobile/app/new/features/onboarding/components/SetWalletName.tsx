import { ActivityIndicator, Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'

export const SetWalletName = ({
  name,
  setName,
  onNext
}: {
  name: string
  setName: (value: string) => void
  onNext: () => void
}): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      return () => setIsLoading(false)
    }, [])
  )

  const handleNext = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      onNext()
    }, 100)
  }, [onNext])

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleNext}
        disabled={name.length === 0 || isLoading}>
        {isLoading ? <ActivityIndicator /> : 'Next'}
      </Button>
    )
  }, [name, handleNext, isLoading])

  return (
    <ScrollScreen
      shouldAvoidKeyboard
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
