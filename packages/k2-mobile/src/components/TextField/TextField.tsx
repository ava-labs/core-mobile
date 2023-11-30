import React, { forwardRef, useState } from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { Text, alpha, useTheme } from '../..'
import { View } from '../Primitives'

export type TextFieldSize = 'small' | 'medium' | 'large'

type TextFieldProps = TextInputProps & {
  label?: string
  size?: TextFieldSize
}

const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      value,
      placeholder,
      label,
      autoCorrect = false,
      size = 'medium',
      style,
      ...rest
    },
    ref
  ) => {
    const {
      theme: { colors }
    } = useTheme()
    const [isActive, setIsActive] = useState(false)
    const isFilled = value && value.length > 0
    const paddingVertical = {
      small: 10,
      medium: 14,
      large: 18
    }[size]

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
          style={[
            {
              paddingHorizontal: 16,
              paddingVertical: paddingVertical,
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
            },
            style
          ]}
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

export { TextField }
