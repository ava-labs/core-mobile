import {
  Icons,
  TextInput,
  TextInputRef,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useRef } from 'react'

export const SimpleTextInput = ({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoFocus,
  secureTextEntry,
  testID = 'text_input'
}: {
  value: string
  onChangeText: (name: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  secureTextEntry?: boolean
  testID?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const ref = useRef<TextInputRef>(null)

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
        autoFocus={autoFocus}
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
        testID={testID}
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
