import React, { useEffect, useRef, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  GroupList,
  PinInput,
  PinInputActions,
  SafeAreaView,
  ScrollView,
  View
} from '@avalabs/k2-alpine'
import { useCreatePin } from 'new/hooks/useCreatePin'
import { Platform, Switch } from 'react-native'
import { KeyboardAvoidingView } from 'react-native'
import ScreenHeader from 'new/components/ScreenHeader'

export default function CreatePin(): JSX.Element {
  const ref = useRef<PinInputActions>(null)
  const [useBiometrics, setUseBiometrics] = useState(true)

  const {
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    chosenPin,
    confirmedPin,
    validPin
  } = useCreatePin({
    onError: async () => {
      await new Promise<void>(resolve => {
        ref.current?.fireWrongPinAnimation(() => {
          resolve()
        })
      })
    }
  })

  useFocusEffect(() => {
    ref.current?.focus()
  })

  useEffect(() => {
    if (validPin) {
      router.navigate('')
    }
  }, [validPin])

  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
