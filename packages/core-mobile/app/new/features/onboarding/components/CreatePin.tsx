import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
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
import DeviceInfoService, {
  BiometricType
} from 'services/deviceInfo/DeviceInfoService'

export const CreatePin = ({
  useBiometrics,
  setUseBiometrics,
  onEnteredValidPin,
  newPinTitle,
  newPinDescription,
  confirmPinTitle,
  keyboardHeight,
  isBiometricAvailable = false
}: {
  useBiometrics: boolean
  setUseBiometrics: (value: boolean) => void
  onEnteredValidPin: (validPin: string) => void
  newPinTitle: string
  newPinDescription?: string
  confirmPinTitle: string
  keyboardHeight?: number
  isBiometricAvailable?: boolean
}): React.JSX.Element => {
  const ref = useRef<PinInputActions>(null)
  const [biometricType, setBiometricType] = useState<BiometricType>(
    BiometricType.NONE
  )
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

  useEffect(() => {
    const getBiometryType = async (): Promise<void> => {
      const type = await DeviceInfoService.getBiometricType()
      setBiometricType(type)
    }
    getBiometryType()
  }, [])

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

  const renderBiometricToggle = useCallback((): React.JSX.Element => {
    return (
      <View
        sx={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          marginBottom: keyboardHeight,
          backgroundColor: '$surfacePrimary'
        }}>
        <GroupList
          data={[
            {
              title: `Unlock with ${biometricType}`,
              accessory: (
                <Toggle
                  onValueChange={setUseBiometrics}
                  value={useBiometrics}
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
      </View>
    )
  }, [useBiometrics, setUseBiometrics, biometricType, keyboardHeight])

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <ScrollView
        contentContainerSx={{
          paddingHorizontal: 16,
          flex: 1
        }}>
        <ScreenHeader
          title={chosenPinEntered ? confirmPinTitle : newPinTitle}
          description={chosenPinEntered ? undefined : newPinDescription}
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
      {!chosenPinEntered && isBiometricAvailable && renderBiometricToggle()}
    </SafeAreaView>
  )
}
