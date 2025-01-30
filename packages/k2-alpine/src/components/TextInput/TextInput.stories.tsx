import React, { useState } from 'react'
import { TouchableOpacity, View } from '../Primitives'
import { Icons, useTheme } from '../..'
import { TextInput } from './TextInput'

export default {
  title: 'TextInput'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [value, setValue] = useState('')
  const [value1, setValue1] = useState('')

  const handleClear = (): void => setValue?.('')
  const handleClear1 = (): void => setValue1?.('')

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        padding: 16,
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="TextInput placeholder"
        rightIcon={
          <TouchableOpacity onPress={handleClear}>
            <Icons.Action.Clear
              width={16}
              height={16}
              color={theme.colors.$textSecondary}
            />
          </TouchableOpacity>
        }
      />
      <View sx={{ marginTop: 16 }} />
      <View
        style={{
          width: '50%',
          height: '100%',
          backgroundColor: theme.colors.$surfacePrimary
        }}>
        <TextInput
          value={value1}
          onChangeText={setValue1}
          leftIcon={
            <Icons.Action.Info
              width={16}
              height={16}
              color={theme.colors.$textSecondary}
            />
          }
          rightIcon={
            <TouchableOpacity onPress={handleClear1}>
              <Icons.Action.Clear
                width={16}
                height={16}
                color={theme.colors.$textSecondary}
              />
            </TouchableOpacity>
          }
        />
      </View>
    </View>
  )
}
