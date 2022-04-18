import React, { useState } from 'react'
import { View } from 'react-native'
import Dialog from 'react-native-dialog'

type Props = {
  onCancel: () => void
  onOk: (password?: string) => void
}

export default function PasswordInput(props: Props | Readonly<Props>) {
  const [password, setPassword] = useState('')

  const onSubmit = (): void => {
    props.onOk(password)
  }

  return (
    <View>
      <Dialog.Container visible>
        <Dialog.Title>Password</Dialog.Title>
        <Dialog.Description>Enter password</Dialog.Description>
        <Dialog.Input
          secureTextEntry={true}
          blurOnSubmit
          onSubmitEditing={onSubmit}
          onChangeText={(text: string) => setPassword(text)}
        />
        <Dialog.Button
          label="Cancel"
          onPress={() => {
            props.onCancel()
          }}
        />
        <Dialog.Button
          label="Ok"
          onPress={() => {
            onSubmit()
          }}
        />
      </Dialog.Container>
    </View>
  )
}
