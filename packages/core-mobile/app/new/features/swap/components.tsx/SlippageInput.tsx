import React, { useRef, useCallback } from 'react'
import {
  AlertWithTextInputs,
  Text,
  useTheme,
  View,
  Pressable
} from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import { isSlippageValid } from '../utils'

const inputKey = 'slippage'

export const SlippageInput = ({
  slippage,
  setSlippage
}: {
  slippage: number
  setSlippage: (slippage: number) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const alert = useRef<AlertWithTextInputsHandle>(null)

  const sanitize = useCallback(
    ({ text }: { text: string; key: string }): string => {
      return text.startsWith('.') ? '0.' : text
    },
    []
  )

  const handlePress = useCallback(() => {
    alert.current?.show({
      title: 'Edit slippage',
      inputs: [
        {
          key: inputKey,
          defaultValue: slippage.toString(),
          keyboardType: 'numeric',
          sanitize
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            alert.current?.hide()
          }
        },
        {
          text: 'Save',
          shouldDisable: (values: Record<string, string>) => {
            const isEmpty = values[inputKey]?.length === 0
            const isInvalid = Boolean(
              values[inputKey] && !isSlippageValid(values[inputKey])
            )
            return isEmpty || isInvalid
          },
          onPress: (values: Record<string, string>) => {
            const enteredValue = values[inputKey]
            enteredValue && setSlippage(Number(enteredValue))
          }
        }
      ]
    })
  }, [sanitize, slippage, setSlippage])

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}>
      <Pressable onPress={handlePress} hitSlop={20}>
        <Text
          variant="mono"
          sx={{
            textAlign: 'right',
            color: theme.colors.$textSecondary,
            fontSize: 15
          }}>
          {slippage.toString() + ' %'}
        </Text>
      </Pressable>
      <AlertWithTextInputs ref={alert} />
    </View>
  )
}
