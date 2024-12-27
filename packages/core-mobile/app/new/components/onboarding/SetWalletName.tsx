import React from 'react'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import { Button, SafeAreaView, ScrollView, View } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'
import { KeyboardAvoidingView } from 'react-native'
import ScreenHeader from 'new/components/ScreenHeader'
import { SimpleTextInput } from 'new/components/SimpleTextInput'

export const SetWalletName = ({
  name,
  setName,
  onNext
}: {
  name: string
  setName: (value: string) => void
  onNext: () => void
}): React.JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView sx={{ flex: 1 }}>
          <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
            <ScreenHeader
              title="How would you like to name your wallet?"
              description="Add a display name for your wallet. You can change it at any time in the app’s settings"
            />
            <SimpleTextInput name={name} setName={setName} />
          </ScrollView>
          <View
            sx={{
              padding: 16,
              backgroundColor: '$surfacePrimary'
            }}>
            <Button
              size="large"
              type="primary"
              onPress={onNext}
              disabled={name.length === 0}>
              Next
            </Button>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
