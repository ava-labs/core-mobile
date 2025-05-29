import {
  Icons,
  TextInput,
  TextInputRef,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useEffect, useRef } from 'react'
import { InteractionManager } from 'react-native'

export const SimpleTextInput = ({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoFocus,
  secureTextEntry
}: {
  value: string
  onChangeText: (name: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  secureTextEntry?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const ref = useRef<TextInputRef>(null)

  useEffect(() => {
    if (autoFocus) {
      InteractionManager.runAfterInteractions(() => {
        ref.current?.focus()
      })
    }
  }, [autoFocus])

  return (
    <View
      sx={{
        paddingRight: 13,
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44
      }}>
      <TextInput
        ref={ref}
        containerSx={{
          flex: 1,
          backgroundColor: 'transparent',
          marginRight: 13
        }}
        textInputSx={{
          fontFamily: 'Inter-Regular',
          height: 44,
          fontSize: 16,
          color: colors.$textPrimary
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        testID="text_input"
        secureTextEntry={secureTextEntry}
      />
      {value.length !== 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Icons.Action.Clear
            width={16}
            height={16}
            color={colors.$textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}
