import { ActivityIndicator, Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'

export const SetWalletName = ({
  name,
  parentIsLoading,
  disabled,
  setName,
  onNext,
  buttonText = 'Next'
}: {
  name: string
  disabled?: boolean
  parentIsLoading?: boolean
  buttonText?: string
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
        testID={
          parentIsLoading || isLoading ? undefined : 'name_wallet_next_btn'
        }
        disabled={disabled || name.length === 0 || isLoading}>
        {parentIsLoading || isLoading ? <ActivityIndicator /> : buttonText}
      </Button>
    )
  }, [
    handleNext,
    isLoading,
    disabled,
    name.length,
    parentIsLoading,
    buttonText
  ])

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
