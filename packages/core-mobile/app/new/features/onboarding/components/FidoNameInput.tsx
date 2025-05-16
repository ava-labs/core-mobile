import { ActivityIndicator, Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'
import React, { useCallback, useState } from 'react'

const FidoNameInput = ({
  title,
  description,
  textInputPlaceholder,
  name,
  isModal,
  setName,
  onSave
}: Omit<FIDONameInputProps, 'fidoType'> & {
  name: string
  setName: (value: string) => void
  onSave: () => Promise<void>
  isModal?: boolean
}): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="large"
        disabled={name === '' || isSaving}
        onPress={handleSave}>
        {isSaving ? <ActivityIndicator /> : 'Next'}
      </Button>
    )
  }, [handleSave, name, isSaving])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      isModal={isModal}
      title={title}
      subtitle={description}
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16, flex: 1 }}
      renderFooter={renderFooter}>
      <View
        style={{
          marginTop: 24
        }}>
        <SimpleTextInput
          value={name}
          placeholder={textInputPlaceholder}
          onChangeText={setName}
        />
      </View>
    </ScrollScreen>
  )
}

export default FidoNameInput
