import { SxProp } from 'dripsy'
import React from 'react'
import { RNTextInput, View } from '../../components/Primitives'
import { useTheme } from '../../hooks'

interface TextInputProps {
  value?: string
  placeholder?: string
  onChangeText?: ((text: string) => void) | undefined
  testID?: string
  sx?: SxProp
  rightIcon?: React.ReactNode
  leftIcon?: React.ReactNode
}

export const TextInput = ({
  testID,
  sx,
  value,
  placeholder,
  onChangeText,
  rightIcon,
  leftIcon
}: TextInputProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        paddingHorizontal: 13,
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        ...sx
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
          <RNTextInput
            testID={testID}
            sx={{
              fontFamily: 'Inter-Regular',
              height: 44,
              fontSize: 16,
              color: colors.$textPrimary
            }}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
          />
        </View>
      </View>
      <View sx={{ alignSelf: 'center' }}>{rightIcon}</View>
    </View>
  )
}
