import React, { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  GroupList,
  PinInput,
  PinInputActions,
  SafeAreaView,
  ScrollView,
  Toggle,
  View
} from '@avalabs/k2-alpine'
import { useCreatePin } from 'features/onboarding/hooks/useCreatePin'
import { InteractionManager } from 'react-native'
import ScreenHeader from 'common/components/ScreenHeader'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { useBiometricType } from 'features/accountSettings/hooks/useBiometricType'

export const CreatePin = ({
  useBiometrics,
  setUseBiometrics,
  onEnteredValidPin
}: {
  useBiometrics: boolean
  setUseBiometrics: (value: boolean) => void
  onEnteredValidPin: (validPin: string) => void
}): React.JSX.Element => {
  const ref = useRef<PinInputActions>(null)
  const bioType = useBiometricType()

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

  useFocusEffect(
    useCallback(() => {
      resetPin()
      InteractionManager.runAfterInteractions(() => {
        ref.current?.focus()
      })
    }, [resetPin])
  )

  useFocusEffect(
    useCallback(() => {
      validPin && onEnteredValidPin(validPin)
    }, [onEnteredValidPin, validPin])
  )

  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView>
        <SafeAreaView sx={{ flex: 1 }}>
          <ScrollView
            sx={{ flex: 1 }}
            contentContainerSx={{
              padding: 16,
              flex: 1
            }}>
            <ScreenHeader
              title={
                chosenPinEntered
                  ? 'Confirm your PIN code'
                  : 'Secure your wallet with a PIN'
              }
              description={
                chosenPinEntered
                  ? undefined
                  : 'For extra security, avoid choosing a PIN that contains repeating digits in a sequential order'
              }
            />
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
          </ScrollView>
          {!chosenPinEntered && (
            <View
              sx={{
                paddingHorizontal: 16,
                paddingBottom: 16,
                backgroundColor: '$surfacePrimary'
              }}>
              <GroupList
                data={[
                  {
                    title: `Unlock with ${bioType}`,
                    accessory: (
                      <Toggle
                        onValueChange={setUseBiometrics}
                        value={useBiometrics}
                      />
                    )
                  }
                ]}
              />
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
