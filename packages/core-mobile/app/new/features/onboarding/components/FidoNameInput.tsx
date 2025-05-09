import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import { FIDONameInputProps } from 'new/routes/onboarding/seedless/(fido)/fidoNameInput'
import React, { useCallback } from 'react'

const FidoNameInput = ({
  title,
  description,
  textInputPlaceholder,
  name,
  isModal,
  setName,
  handleSave
}: Omit<FIDONameInputProps, 'fidoType'> & {
  name: string
  setName: (value: string) => void
  handleSave: () => void
  isModal?: boolean
}): JSX.Element => {
  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="large"
        disabled={name === ''}
        onPress={handleSave}>
        Next
      </Button>
    )
  }, [handleSave, name])

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
