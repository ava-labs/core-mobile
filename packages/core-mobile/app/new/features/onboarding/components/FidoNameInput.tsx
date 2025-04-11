import React, { useEffect, useState } from 'react'
import { View, Button, ScrollView, SafeAreaView } from '@avalabs/k2-alpine'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import ScreenHeader from 'common/components/ScreenHeader'
import { Platform, Keyboard, KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const { bottom } = useSafeAreaInsets()

  // Configure keyboard listeners
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const keyboardDidShow = (e: KeyboardEvent): void => {
      setKeyboardHeight(e.endCoordinates.height - bottom + 24)
    }
    const keyboardDidHide = (): void => {
      setKeyboardHeight(0)
    }

    const showSub = Keyboard.addListener('keyboardDidShow', keyboardDidShow)
    const hideSub = Keyboard.addListener('keyboardDidHide', keyboardDidHide)

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [bottom])

  return (
    <SafeAreaView sx={{ flex: 1, marginBottom: keyboardHeight }}>
      <ScrollView
        sx={{ flex: 1 }}
        contentContainerStyle={{
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
  )
}

export default FidoNameInput
