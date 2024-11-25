import React, { useCallback, useState } from 'react'
import { KeyboardTypeOptions } from 'react-native'
import Dialog from 'react-native-dialog'

export const useAlert = ({
  title,
  description,
  verticalButtons,
  inputs,
  buttons
}: AlertProps): Alert => {
  const [visible, setVisible] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const show = useCallback(() => setVisible(true), [])
  const hide = useCallback(() => {
    setValues({})
    setVisible(false)
  }, [])
  const render = useCallback(() => {
    return (
      <Dialog.Container visible={visible} verticalButtons={verticalButtons}>
        {title && title.length > 0 && <Dialog.Title>{title}</Dialog.Title>}
        {description && description.length > 0 && (
          <Dialog.Description>{description}</Dialog.Description>
        )}
        {inputs &&
          inputs.map(input => (
            <Dialog.Input
              key={input.key}
              keyboardType={input.keyboardType}
              secureTextEntry={input.secureTextEntry ?? false}
              blurOnSubmit
              onChangeText={(text: string) =>
                setValues({ ...values, [input.key]: text })
              }
            />
          ))}
        {buttons.map(action => {
          const disabled = action.shouldDisable && action.shouldDisable(values)

          return (
            <Dialog.Button
              key={action.title}
              label={action.title}
              color={disabled ? 'gray' : action.destructive ? 'red' : undefined}
              bold={action.bold}
              onPress={() => {
                action.onAction(values)
              }}
              disabled={disabled}
            />
          )
        })}
      </Dialog.Container>
    )
  }, [buttons, description, inputs, title, values, verticalButtons, visible])

  return {
    render,
    show,
    hide
  }
}

type AlertProps = {
  title?: string
  description?: string
  verticalButtons?: boolean
  inputs?: {
    key: string
    keyboardType?: KeyboardTypeOptions
    secureTextEntry?: boolean
  }[]
  buttons: {
    title: string
    destructive?: boolean
    bold?: boolean
    onAction: (values: Record<string, string>) => void
    shouldDisable?: (values: Record<string, string>) => boolean
  }[]
}

type Alert = {
  render: () => JSX.Element
  show: () => void
  hide: () => void
}
