import React, { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  GroupList,
  PinInput,
  PinInputActions,
  SafeAreaView,
  ScrollView,
  View
} from '@avalabs/k2-alpine'
import { useCreatePin } from 'features/onboarding/hooks/useCreatePin'
import { Switch } from 'react-native'
import ScreenHeader from 'common/components/ScreenHeader'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'

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
      ref.current?.focus()
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
          <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
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
                position: 'absolute',
                alignItems: 'center',
                left: 0,
                right: 0,
                top: 180,
                padding: 20
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
          <View
            sx={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              backgroundColor: '$surfacePrimary',
              gap: 16
            }}>
            {!chosenPinEntered && (
              <GroupList
                data={[
                  {
                    title: 'Unlock with Face ID',
                    accessory: (
                      <Switch
                        value={useBiometrics}
                        onValueChange={setUseBiometrics}
                      />
                    )
                  }
                ]}
              />
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
