import { Button, View } from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { OidcAuth } from 'features/onboarding/types/types'
import React, { useCallback, useState } from 'react'

export const AddRecoveryMethods = ({
  oidcAuth,
  availableRecoveryMethods,
  allowsUserToAddLater,
  onNext,
  onSkip,
  wizardStep
}: {
  oidcAuth?: OidcAuth
  availableRecoveryMethods: RecoveryMethod[]
  allowsUserToAddLater: boolean
  onNext: (method: RecoveryMethod) => void
  onSkip: () => void
  wizardStep?: { currentStep: number; totalSteps: number }
}): JSX.Element => {
  // In Hello UI / wizard mode the user picks a method by tapping a tile
  // (no immediate advance); the FAB then confirms the chosen method or
  // skips when nothing is selected.
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod>()

  const handleTilePress = useCallback(
    (method: RecoveryMethod) => {
      if (wizardStep) {
        setSelectedMethod(method)
        return
      }
      onNext(method)
    },
    [wizardStep, onNext]
  )

  const handleFabNext = useCallback(() => {
    if (selectedMethod) {
      onNext(selectedMethod)
      return
    }
    onSkip()
  }, [selectedMethod, onNext, onSkip])

  const renderFooter = useCallback(() => {
    if (wizardStep) {
      return (
        <OnboardingWizardFooter
          currentStep={wizardStep.currentStep}
          totalSteps={wizardStep.totalSteps}
          onNext={handleFabNext}
          testID="recovery_method_next"
        />
      )
    }
    if (oidcAuth === undefined && allowsUserToAddLater) {
      return (
        <Button type="tertiary" size="large" onPress={onSkip}>
          Skip
        </Button>
      )
    }
    return <></>
  }, [
    wizardStep,
    handleFabNext,
    oidcAuth,
    allowsUserToAddLater,
    onSkip
  ])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title="Add a recovery method"
      subtitle="Add recovery methods to securely restore access in case you lose your credentials."
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <RecoveryMethodList
          data={availableRecoveryMethods}
          onPress={handleTilePress}
          selectedType={selectedMethod?.type}
        />
      </View>
    </ScrollScreen>
  )
}
