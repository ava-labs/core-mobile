import { AlertWithTextInputs } from '@avalabs/k2-alpine'
import { ShowAlertWithTextInputsConfig } from '@avalabs/k2-alpine/src/components/Alert/types'
import React from 'react'
import { Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'

export const GlobalAlertWithTextInput = (): JSX.Element => {
  const AlertComponent = (
    <AlertWithTextInputs
      ref={ref => {
        if (ref) {
          // @ts-ignore TODO: fix types
          global.alertWithTextInput = ref
        }
      }}
    />
  )

  // On iOS, wrap with FullWindowOverlay to ensure dialog appears above native screens
  // On Android, the dialog should work without FullWindowOverlay
  return Platform.OS === 'ios' ? (
    <FullWindowOverlay>{AlertComponent}</FullWindowOverlay>
  ) : (
    AlertComponent
  )
}

export function showAlertWithTextInput(
  props: ShowAlertWithTextInputsConfig
): void {
  // @ts-ignore TODO: fix types
  global?.alertWithTextInput?.show(props)
}

export function dismissAlertWithTextInput(): void {
  // @ts-ignore TODO: fix types
  global?.alertWithTextInput?.hide()
}
