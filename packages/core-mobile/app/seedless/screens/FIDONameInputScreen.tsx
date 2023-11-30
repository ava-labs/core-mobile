import { Button, TextField, ScrollView, Text, View } from '@avalabs/k2-mobile'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Space } from 'components/Space'
import { TextInput } from 'react-native'
import { BackButton } from 'components/BackButton'

type FIDONameInputScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.FIDONameInput
>

export const FIDONameInputScreen = (): JSX.Element => {
  const { canGoBack, goBack, setOptions } =
    useNavigation<FIDONameInputScreenProps['navigation']>()
  const inputFieldRef = useRef<TextInput>(null)
  const {
    params: {
      title,
      description,
      inputFieldLabel,
      inputFieldPlaceholder,
      onClose
    }
  } = useRoute<FIDONameInputScreenProps['route']>()
  const [name, setName] = useState<string>()

  const handleSkip = (): void => {
    if (canGoBack()) {
      goBack()
    }

    onClose()
  }

  const handleSave = (): void => {
    if (canGoBack()) {
      goBack()
    }

    onClose(name)
  }

  useLayoutEffect(() => {
    setOptions({
      headerTitle: '',
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => <BackButton />
    })
  }, [setOptions])

  return (
    <View
      sx={{
        flex: 1
      }}>
      <ScrollView
        sx={{
          flexGrow: 1
        }}
        contentContainerSx={{
          paddingHorizontal: 16
        }}
        keyboardDismissMode="on-drag">
        <View sx={{ flexGrow: 1 }}>
          <Text variant="heading3">{title}</Text>
          <View sx={{ marginVertical: 16 }}>
            <Text variant="body1" sx={{ color: '$neutral50' }}>
              {description}
            </Text>
            <Space y={24} />
            <TextField
              ref={inputFieldRef}
              value={name}
              placeholder={inputFieldPlaceholder}
              label={inputFieldLabel}
              autoFocus={true}
              onChangeText={text => setName(text)}
            />
          </View>
        </View>
      </ScrollView>
      <View sx={{ paddingHorizontal: 16 }}>
        <Button
          type="primary"
          size="xlarge"
          onPress={handleSave}
          disabled={(name ?? '').length === 0}>
          Save
        </Button>
        <Button
          type="secondary"
          size="xlarge"
          style={{ marginVertical: 16 }}
          onPress={handleSkip}>
          Skip
        </Button>
      </View>
    </View>
  )
}
