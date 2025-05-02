import { AlertWithTextInputs } from '@avalabs/k2-alpine'
import { ShowAlertWithTextInputsConfig } from '@avalabs/k2-alpine/src/components/Alert/types'
import React from 'react'
import { FullWindowOverlay } from 'react-native-screens'

export const GlobalAlertWithTextInput = (): JSX.Element => {
  return (
    <FullWindowOverlay>
      <AlertWithTextInputs
        ref={ref => {
          if (ref) {
            global.alertWithTextInput = ref
          }
        }}
      />
    </FullWindowOverlay>
  )
}

export function showAlertWithTextInput(
  props: ShowAlertWithTextInputsConfig
): void {
  global?.alertWithTextInput?.show(props)
}

export function dismissAlertWithTextInput(): void {
  global?.alertWithTextInput?.hide()
}
