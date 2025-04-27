import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { Button, ScrollView, View } from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { SafeAreaView } from 'react-native-safe-area-context'

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
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView>
          <ScrollView
            sx={{ flex: 1 }}
            contentContainerSx={{ padding: 16, gap: 27 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag">
            <ScreenHeader
              title="How would you like to name your wallet?"
              description="Add a display name for your wallet. You can change it at any time in the app’s settings"
            />
            <SimpleTextInput value={name} onChangeText={setName} />
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
