import React, { useCallback, useEffect, useRef } from 'react'
import {
  GroupList,
  PinInput,
  PinInputActions,
  Text,
  Toggle,
  View
} from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useAfterScreenEnterTransition } from 'common/hooks/useAfterScreenEnterTransition'
import { useCreatePin } from 'features/onboarding/hooks/useCreatePin'
import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { Keyboard } from 'react-native'

export const CreatePin = ({
  useBiometrics,
  setUseBiometrics,
  onEnteredValidPin,
  newPinTitle,
  newPinDescription,
  confirmPinTitle,
  isBiometricAvailable = false,
  isModal = false,
  wizardStep
}: {
  useBiometrics: boolean
  setUseBiometrics: (value: boolean) => void
  onEnteredValidPin: (validPin: string) => void
  newPinTitle: string
  newPinDescription?: string
  confirmPinTitle: string
  isBiometricAvailable?: boolean
  isModal?: boolean
  // Wizard footer is decorative on this screen — PIN auto-advances on
  // 6 valid digits, so the FAB stays disabled and informational.
  wizardStep?: { currentStep: number; totalSteps: number }
}): React.JSX.Element => {
  const ref = useRef<PinInputActions>(null)
  const processedValidPinRef = useRef<string | undefined>(undefined)
  const { biometricType } = useStoredBiometrics()
  const {
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    chosenPin,
    confirmedPin,
    validPin,
    resetPin
  } = useCreatePin({
    onError: async () => {
      await new Promise<void>(resolve => {
        ref.current?.fireWrongPinAnimation(() => {
          resolve()
        })
      })
    }
  })

  const onScreenFocus = useCallback(() => {
    resetPin()
    processedValidPinRef.current = undefined
  }, [resetPin])

  useAfterScreenEnterTransition(() => ref.current?.focus(), {
    onScreenFocus
  })

  useEffect(() => {
    // Only process the valid pin if it hasn't been processed yet
    if (validPin && processedValidPinRef.current !== validPin) {
      processedValidPinRef.current = validPin
      Keyboard.dismiss()
      onEnteredValidPin(validPin)
    }
  }, [validPin, onEnteredValidPin])

  const renderBiometricToggle = useCallback((): React.JSX.Element => {
    return (
      <GroupList
        data={[
          {
            title: `Unlock with ${biometricType}`,
            accessory: (
              <Toggle
                onValueChange={setUseBiometrics}
                value={useBiometrics}
                disabled={!isBiometricAvailable}
                testID={
                  useBiometrics
                    ? 'toggle_biometrics_on'
                    : 'toggle_biometrics_off'
                }
              />
            )
          }
        ]}
      />
    )
  }, [useBiometrics, setUseBiometrics, biometricType, isBiometricAvailable])

  // In limited mode the wizard footer is always present (decorative,
  // FAB always disabled); on the new-pin step we stack the biometric
  // toggle above it. Default flow keeps the legacy footer rules.
  const renderFooter = useCallback((): React.JSX.Element | null => {
    if (wizardStep) {
      const showBiometric = !chosenPinEntered && isBiometricAvailable
      return (
        <View sx={{ gap: 16 }}>
          {showBiometric && renderBiometricToggle()}
          <OnboardingWizardFooter
            currentStep={wizardStep.currentStep}
            totalSteps={wizardStep.totalSteps}
            onNext={() => undefined}
            disabled
          />
        </View>
      )
    }
    if (!chosenPinEntered && isBiometricAvailable) {
      return renderBiometricToggle()
    }
    return null
  }, [
    wizardStep,
    chosenPinEntered,
    isBiometricAvailable,
    renderBiometricToggle
  ])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      isModal={isModal}
      shouldAvoidKeyboard
      title={chosenPinEntered ? confirmPinTitle : newPinTitle}
      contentContainerStyle={{ padding: 16, flex: 1 }}
      renderFooter={
        wizardStep ||
        (!chosenPinEntered && isBiometricAvailable)
          ? renderFooter
          : undefined
      }>
      {chosenPinEntered ? undefined : (
        <Text variant="subtitle1">{newPinDescription}</Text>
      )}

      <View
        sx={{
          flex: 1,
          justifyContent: 'center'
        }}>
        <PinInput
          ref={ref}
          length={6}
          value={chosenPinEntered ? confirmedPin : chosenPin}
          onChangePin={
            chosenPinEntered ? onEnterConfirmedPin : onEnterChosenPin
          }
        />
      </View>
    </ScrollScreen>
  )
}
