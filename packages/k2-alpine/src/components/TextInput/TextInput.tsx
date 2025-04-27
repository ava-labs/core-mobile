import React, { useRef, forwardRef, useImperativeHandle } from 'react'
import {
  TextInputProps as _TextInputProps,
  TextInput as _TextInput,
  TextStyle
} from 'react-native'
import { SxProp } from 'dripsy'
import { View } from '../../components/Primitives'
import { useTheme } from '../../hooks'

interface TextInputProps extends _TextInputProps {
  rightIcon?: React.ReactNode
  leftIcon?: React.ReactNode
  containerSx?: SxProp
  textInputSx?: TextStyle
}

export type TextInputRef = {
  focus: () => void
  blur: () => void
  clear: () => void
}

export const TextInput = forwardRef<TextInputRef, TextInputProps>(
  (
    {
      testID,
      value,
      placeholder,
      autoFocus,
      textAlign,
      onChangeText,
      onBlur,
      onSubmitEditing,
      submitBehavior,
      autoCorrect,
      editable,
      rightIcon,
      leftIcon,
      maxLength,
      keyboardType,
      containerSx,
      textInputSx
    }: TextInputProps,
    ref
  ): JSX.Element => {
    const {
      theme: { colors }
    } = useTheme()

    const inputRef = useRef<_TextInput>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => inputRef.current?.clear()
    }))

    return (
      <View
        sx={{
          paddingHorizontal: 16,
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
          ...containerSx
        }}>
        <View
          sx={{
            flex: 1,
            gap: 10,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          {leftIcon}
          <View sx={{ flex: 1 }}>
            <_TextInput
              textAlign={textAlign}
              ref={inputRef}
              onBlur={onBlur}
              keyboardType={keyboardType}
              autoFocus={autoFocus}
              onSubmitEditing={onSubmitEditing}
              submitBehavior={submitBehavior}
              autoCorrect={autoCorrect}
              testID={testID}
              style={{
                fontFamily: 'Inter-Regular',
                height: 44,
                fontSize: 16,
                color: colors.$textPrimary,
                ...textInputSx
              }}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              selectionColor={colors.$textPrimary}
              maxLength={maxLength}
              editable={editable}
            />
          </View>
        </View>
        <View sx={{ alignSelf: 'center' }}>{rightIcon}</View>
      </View>
    )
  }
)
