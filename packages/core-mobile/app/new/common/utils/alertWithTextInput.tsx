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
            // @ts-ignore TODO: fix types
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
  // @ts-ignore TODO: fix types
  global?.alertWithTextInput?.show(props)
}

export function dismissAlertWithTextInput(): void {
  // @ts-ignore TODO: fix types
  global?.alertWithTextInput?.hide()
}
