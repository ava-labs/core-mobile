import React from 'react'
import {
  Icons,
  TextInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'

export const SimpleTextInput = ({
  name,
  setName,
  placeholder
}: {
  name: string
  setName: (name: string) => void
  placeholder?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      sx={{
        marginTop: 27,
        paddingHorizontal: 13,
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44
      }}>
      <TextInput
        sx={{
          flex: 1,
          fontFamily: 'Inter-Regular',
          marginRight: 13,
          height: 44,
          fontSize: 16,
          color: colors.$textPrimary
        }}
        value={name}
        onChangeText={setName}
        placeholder={placeholder}
      />
      {name.length !== 0 && (
        <TouchableOpacity onPress={() => setName('')}>
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
