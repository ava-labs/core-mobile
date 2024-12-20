import React, { useRef } from 'react'
import { router, useFocusEffect } from 'expo-router'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  Button,
  Card,
  PinInput,
  PinInputActions,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from '@avalabs/k2-alpine'
import { useCreatePin } from 'new/hooks/useCreatePin'
import { Platform } from 'react-native'
import { KeyboardAvoidingView } from 'react-native'

export default function CreatePin(): JSX.Element {
  const ref = useRef<PinInputActions>(null)

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

  function handleNext(): void {
    router.navigate('')
  }

  useFocusEffect(() => {
    ref.current?.focus()
  })

  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView sx={{ flex: 1 }}>
          <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
            <Text
              sx={{ marginRight: 10, marginTop: 8, marginBottom: 10 }}
              variant="heading2">
              Secure your wallet with a PIN
            </Text>
            <View sx={{ marginTop: 8, gap: 16 }}>
              <Text testID="anlaysticsContent" variant="subtitle1">
                For extra security, avoid choosing a PIN that contains repeating
                digits in a sequential order
              </Text>
            </View>
            <View sx={{ paddingVertical: 48 }}>
              <PinInput
                ref={ref}
                length={6}
                value={chosenPinEntered ? confirmedPin : chosenPin}
                onChangePin={
                  chosenPinEntered ? onEnterConfirmedPin : onEnterChosenPin
                }
              />
            </View>
            <Card>
              <Text>asdf</Text>
            </Card>
          </ScrollView>
          <View
            sx={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              backgroundColor: '$surfacePrimary',
              gap: 16
            }}>
            <Button
              size="large"
              type="primary"
              onPress={handleNext}
              disabled={!validPin}>
              Next
            </Button>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
