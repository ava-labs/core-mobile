import React from 'react'
import {
  Icons,
  TextInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'

export const SimpleTextInput = ({
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoFocus
}: {
  value: string
  onChangeText: (name: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
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
        autoFocus={autoFocus}
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
