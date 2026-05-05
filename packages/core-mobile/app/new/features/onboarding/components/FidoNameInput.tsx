import { ActivityIndicator, Button, View } from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'
import React, { useCallback, useState } from 'react'

const FidoNameInput = ({
  title,
  description,
  textInputPlaceholder,
  name,
  isModal,
  setName,
  onSave,
  wizardStep
}: Omit<FIDONameInputProps, 'fidoType'> & {
  name: string
  setName: (value: string) => void
  onSave: () => Promise<void>
  isModal?: boolean
  wizardStep?: { currentStep: number; totalSteps: number }
}): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const isDisabled = name === '' || isSaving

  const renderFooter = useCallback(() => {
    if (wizardStep) {
      return (
        <OnboardingWizardFooter
          currentStep={wizardStep.currentStep}
          totalSteps={wizardStep.totalSteps}
          onNext={handleSave}
          disabled={isDisabled}
        />
      )
    }
    return (
      <Button
        type="primary"
        size="large"
        disabled={isDisabled}
        onPress={handleSave}>
        {isSaving ? <ActivityIndicator /> : 'Next'}
      </Button>
    )
  }, [handleSave, isDisabled, isSaving, wizardStep])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      isModal={isModal}
      title={title}
      subtitle={description}
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16, flex: 1 }}
      renderFooter={renderFooter}>
      <View
        style={{
          marginTop: 24
        }}>
        <SimpleTextInput
          value={name}
          placeholder={textInputPlaceholder}
          onChangeText={setName}
        />
      </View>
    </ScrollScreen>
  )
}

export default FidoNameInput
