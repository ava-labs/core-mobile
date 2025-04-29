import {
  GroupList,
  PinInput,
  PinInputActions,
  Text,
  Toggle,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFocusEffect } from 'expo-router'
import { useCreatePin } from 'features/onboarding/hooks/useCreatePin'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { InteractionManager } from 'react-native'
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
  isBiometricAvailable = false,
  isModal = false
}: {
  useBiometrics: boolean
  setUseBiometrics: (value: boolean) => void
  onEnteredValidPin: (validPin: string) => void
  newPinTitle: string
  newPinDescription?: string
  confirmPinTitle: string
  isBiometricAvailable?: boolean
  isModal?: boolean
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
    )
  }, [useBiometrics, setUseBiometrics, biometricType])

  return (
    <ScrollScreen
      isModal={isModal}
      title={chosenPinEntered ? confirmPinTitle : newPinTitle}
      navigationTitle={chosenPinEntered ? confirmPinTitle : newPinTitle}
      contentContainerStyle={{ padding: 16, flex: 1 }}
      renderFooter={
        !chosenPinEntered && isBiometricAvailable
          ? renderBiometricToggle
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
