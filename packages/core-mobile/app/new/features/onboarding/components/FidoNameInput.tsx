import React from 'react'
import { View, Button, ScrollView, SafeAreaView } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import ScreenHeader from 'common/components/ScreenHeader'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'

const FidoNameInput = ({
  title,
  description,
  textInputPlaceholder,
  name,
  setName,
  handleSave
}: Omit<FIDONameInputProps, 'fidoType'> & {
  name: string
  setName: (value: string) => void
  handleSave: () => void
}): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView>
        <SafeAreaView sx={{ flex: 1 }}>
          <ScrollView
            sx={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 25,
              paddingHorizontal: 16,
              gap: 27
            }}>
            <ScreenHeader title={title} description={description} />
            <SimpleTextInput
              value={name}
              placeholder={textInputPlaceholder}
              onChangeText={setName}
            />
          </ScrollView>
          <View sx={{ padding: 16, backgroundColor: '$surfacePrimary' }}>
            <Button
              type="primary"
              size="large"
              disabled={name === ''}
              onPress={handleSave}>
              Next
            </Button>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}

export default FidoNameInput
