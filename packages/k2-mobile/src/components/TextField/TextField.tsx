import React, { forwardRef, useState } from 'react'
import { TextInput as rTextInput, TextInputProps } from 'react-native'
import { Text, alpha, useTheme } from '../..'
import { View, TextInput } from '../Primitives'

export type TextFieldSize = 'small' | 'medium' | 'large'

type TextFieldProps = TextInputProps & {
  label?: string
  size?: TextFieldSize
}

const TextField = forwardRef<rTextInput, TextFieldProps>(
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
          sx={{
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
          }}
          style={style}
          ref={ref}
          value={value}
          placeholder={placeholder}
          // @ts-ignore
          placeholderTextColor={isActive ? '$neutral50' : '$neutral400'}
          autoCorrect={autoCorrect}
          allowFontScaling={false}
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
