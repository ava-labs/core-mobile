import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState
} from 'react'
import { Alert as NativeAlert } from 'react-native'
import Dialog from 'react-native-dialog'
import { View } from '../Primitives'
import {
  AlertWithTextInputsHandle,
  ShowAlertConfig,
  ShowAlertWithTextInputsConfig
} from './types'

export const AlertWithTextInputs = forwardRef<
  AlertWithTextInputsHandle,
  object
>((_, ref) => {
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState<ShowAlertWithTextInputsConfig | null>(
    null
  )
  const [values, setValues] = useState<Record<string, string>>({})

  const show = useCallback((alertConfig: ShowAlertWithTextInputsConfig) => {
    setValues(
      alertConfig.inputs.reduce((acc, input) => {
        acc[input.key] = input.defaultValue ?? ''
        return acc
      }, {} as Record<string, string>)
    )
    setConfig(alertConfig)
    setVisible(true)
  }, [])

  const hide = (): void => {
    setVisible(false)
  }

  useImperativeHandle(ref, () => ({
    show,
    hide
  }))

  if (!config) return null

  const { title, description, verticalButtons, inputs, buttons } = config

  return (
    <View>
      <Dialog.Container
        visible={visible}
        verticalButtons={verticalButtons}
        useNativeDriver>
        {title && title.length > 0 && <Dialog.Title>{title}</Dialog.Title>}
        {description && description.length > 0 && (
          <Dialog.Description>{description}</Dialog.Description>
        )}
        {inputs.map(input => (
          <Dialog.Input
            testID="dialog_input"
            value={values[input.key]}
            key={input.key}
            autoCorrect={false}
            autoFocus
            keyboardType={input.keyboardType}
            secureTextEntry={input.secureTextEntry ?? false}
            blurOnSubmit
            onChangeText={(text: string) => {
              const sanitized =
                typeof input.sanitize === 'function'
                  ? input.sanitize({ key: input.key, text })
                  : text
              setValues(current => ({ ...current, [input.key]: sanitized }))
            }}
          />
        ))}
        {buttons.map((button, index) => {
          const disabled = button.shouldDisable?.(values)
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
                setVisible(false)
              }}
              disabled={disabled}
            />
          )
        })}
      </Dialog.Container>
    </View>
  )
})

export function showAlert({
  title,
  description,
  buttons,
  options
}: ShowAlertConfig): void {
  // use react-native's Alert for now
  NativeAlert.alert(title, description, buttons, options)
}
