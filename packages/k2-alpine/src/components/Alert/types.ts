import { AlertOptions, KeyboardTypeOptions } from 'react-native'

export type AlertButton<T> = {
  text: string
  style?: 'default' | 'cancel' | 'destructive'
  onPress?: (values: T) => void
  shouldDisable?: (values: T) => boolean
}

export type AlertWithTextInputsHandle = {
  show: (config: ShowAlertWithTextInputsConfig) => void
  hide: () => void
}

export type AlertWithTextInputsProps = {
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

export type ShowAlertWithTextInputsConfig = {
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

export type ShowAlertConfig = {
  title: string
  description?: string
  buttons: AlertButton<string | undefined>[]
  options?: AlertOptions
}
