import { Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import React, { useCallback } from 'react'
import { isSlippageValid } from '../utils'

const inputKey = 'slippage'

export const SlippageInput = ({
  slippage,
  setSlippage,
  disabled
}: {
  slippage: number
  setSlippage: (slippage: number) => void
  disabled?: boolean
}): JSX.Element => {
  const { theme } = useTheme()

  const sanitize = useCallback(
    ({ text }: { text: string; key: string }): string => {
      return text.startsWith('.') ? '0.' : text
    },
    []
  )

  const handlePress = useCallback(() => {
    showAlertWithTextInput({
      title: 'Custom slippage',
      description: 'Allowed range: 0.1% - 50%',
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
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          style: 'default',
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
      <Pressable onPress={handlePress} hitSlop={20} disabled={disabled}>
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
    </View>
  )
}
