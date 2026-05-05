import {
  ActivityIndicator,
  Button,
  TextInputRef,
  View
} from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { useAfterScreenEnterTransition } from 'common/hooks/useAfterScreenEnterTransition'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useRef, useState } from 'react'
import { Keyboard } from 'react-native'

export const SetWalletName = ({
  name,
  parentIsLoading,
  disabled,
  setName,
  onNext,
  buttonText = 'Next',
  wizardStep
}: {
  name: string
  disabled?: boolean
  parentIsLoading?: boolean
  buttonText?: string
  setName: (value: string) => void
  onNext: () => void
  wizardStep?: { currentStep: number; totalSteps: number }
}): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState(false)
  const nameInputRef = useRef<TextInputRef>(null)

  useAfterScreenEnterTransition(() => nameInputRef.current?.focus())

  useFocusEffect(
    useCallback(() => {
      return () => setIsLoading(false)
    }, [])
  )

  const handleNext = useCallback(() => {
    setIsLoading(true)
    Keyboard.dismiss()
    setTimeout(() => {
      onNext()
    }, 100)
  }, [onNext])

  const isDisabled = disabled || name.length === 0 || isLoading

  const renderFooter = useCallback(() => {
    if (wizardStep) {
      return (
        <OnboardingWizardFooter
          currentStep={wizardStep.currentStep}
          totalSteps={wizardStep.totalSteps}
          onNext={handleNext}
          disabled={isDisabled}
          testID="name_wallet_next_btn"
        />
      )
    }
    return (
      <Button
        accessible={true}
        size="large"
        type="primary"
        onPress={handleNext}
        testID="name_wallet_next_btn"
        disabled={isDisabled}>
        {parentIsLoading || isLoading ? <ActivityIndicator /> : buttonText}
      </Button>
    )
  }, [
    handleNext,
    isLoading,
    isDisabled,
    parentIsLoading,
    buttonText,
    wizardStep
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
          ref={nameInputRef}
          testID="name_text_input"
          value={name}
          onChangeText={setName}
        />
      </View>
    </ScrollScreen>
  )
}
