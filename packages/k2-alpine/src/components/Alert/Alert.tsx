import React, { useEffect, useState } from 'react'
import { AlertOptions, KeyboardTypeOptions } from 'react-native'
import Dialog from 'react-native-dialog'
import { Alert as NativeAlert } from 'react-native'

export const AlertWithTextInputs = ({
  visible,
  title,
  description,
  verticalButtons,
  inputs,
  buttons
}: AlertWithTextInputsProps): JSX.Element => {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setValues(
      inputs.reduce((acc, input) => {
        acc[input.key] = input.defaultValue ?? ''
        return acc
      }, {} as Record<string, string>)
    )
  }, [inputs])

  return (
    <Dialog.Container
      visible={visible}
      verticalButtons={verticalButtons}
      useNativeDriver>
      {title && title.length > 0 && <Dialog.Title>{title}</Dialog.Title>}
      {description && description.length > 0 && (
        <Dialog.Description>{description}</Dialog.Description>
      )}
      {inputs &&
        inputs.map(input => (
          <Dialog.Input
            value={values[input.key]}
            key={input.key}
            autoCorrect={false}
            autoFocus
            keyboardType={input.keyboardType}
            secureTextEntry={input.secureTextEntry ?? false}
            blurOnSubmit
            onChangeText={(text: string) =>
              setValues(current => ({ ...current, [input.key]: text }))
            }
          />
        ))}
      {buttons.map((button, index) => {
        const disabled = button.shouldDisable && button.shouldDisable(values)
        const bold = button.style === 'cancel'

        return (
          <Dialog.Button
            key={index.toString()}
            label={button.text}
            color={
              disabled
                ? 'gray'
                : button.style === 'destructive'
                ? 'red'
                : undefined
            }
            bold={bold}
            onPress={() => {
              button.onPress?.(values)
            }}
            disabled={disabled}
          />
        )
      })}
    </Dialog.Container>
  )
}

type AlertWithTextInputsProps = {
  visible: boolean
  title?: string
  description?: string
  verticalButtons?: boolean
  inputs: {
    key: string
    defaultValue?: string
    keyboardType?: KeyboardTypeOptions
    secureTextEntry?: boolean
  }[]
  buttons: AlertButton<Record<string, string>>[]
}

type AlertButton<T> = {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: (values: T) => void
  shouldDisable?: (values: T) => boolean
}

export function showAlert({
  title,
  description,
  buttons,
  options
}: {
  title: string
  description?: string
  buttons: AlertButton<string | undefined>[]
  options?: AlertOptions
}): void {
  // use react-native's Alert for now
  NativeAlert.alert(title, description, buttons, options)
}
