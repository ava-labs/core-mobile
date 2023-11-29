import { View } from 'dripsy'
import React, { forwardRef, useState } from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { Text, alpha, useTheme } from '../..'

type InputFieldProps = TextInputProps & { label?: string }

const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ value, placeholder, label, autoCorrect = false, ...rest }, ref) => {
    const {
      theme: { colors }
    } = useTheme()
    const [isActive, setIsActive] = useState(false)
    const isFilled = value && value.length > 0

    return (
      <View>
        {label && label.length > 0 && (
          <Text
            variant="inputLabel"
            sx={{ color: '$neutral50', marginBottom: 8 }}>
            {label}
          </Text>
        )}
        <TextInput
          style={{
            paddingHorizontal: 16,
            paddingVertical: 18,
            fontSize: 16,
            backgroundColor: isActive
              ? 'transparent'
              : alpha(colors.$neutral700, 0.5),
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isActive
              ? colors.$neutral50
              : isFilled
              ? colors.$neutral700
              : 'transparent',
            color: colors.$neutral50
          }}
          ref={ref}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={
            isActive ? colors.$neutral50 : colors.$neutral400
          }
          autoCorrect={autoCorrect}
          onFocus={e => {
            setIsActive(true)
            rest.onFocus?.(e)
          }}
          onBlur={e => {
            setIsActive(false)
            rest.onBlur?.(e)
          }}
          {...rest}
        />
      </View>
    )
  }
)

export { InputField }
