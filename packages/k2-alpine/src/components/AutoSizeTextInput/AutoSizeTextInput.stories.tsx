import React, { useState } from 'react'
import { Platform } from 'react-native'
import { ScrollView, Text, View } from '../Primitives'
import { AutoSizeTextInput } from './AutoSizeTextInput'

export default {
  title: 'AutoSizeTextInput'
}

export const All = (): JSX.Element => {
  const [value, setValue] = useState('107.25')

  return (
    <ScrollView
      sx={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16, paddingHorizontal: 16, gap: 32 }}>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">
          AutoSizeTextInput with initial font size 60
        </Text>
        <AutoSizeTextInput
          value={value}
          onChangeText={setValue}
          initialFontSize={60}
          placeholder="0.00"
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">AutoSizeTextInput</Text>
        <AutoSizeTextInput
          value={value}
          onChangeText={setValue}
          placeholder="0.00"
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">AutoSizeTextInput with prefix</Text>
        <AutoSizeTextInput
          value={value}
          prefix="$"
          placeholder="$0.00"
          onChangeText={setValue}
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">AutoSizeTextInput with suffix</Text>
        <AutoSizeTextInput
          value={value}
          suffix="AVAX"
          suffixSx={{
            marginBottom: 20
          }}
          placeholder="0.00"
          alwaysShowPrefixAndSuffix={true}
          onChangeText={setValue}
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">
          AutoSizeTextInput with renderRight as suffix
        </Text>
        <AutoSizeTextInput
          value={value}
          suffix="AVAX"
          placeholder="0.00"
          onChangeText={setValue}
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
      <View sx={{ gap: 16, width: '100%' }}>
        <Text variant="heading6">AutoSizeTextInput with textAlign="right"</Text>
        <AutoSizeTextInput
          value={value}
          textAlign="right"
          style={{}}
          placeholder="0.00"
          onChangeText={setValue}
          keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
          inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        />
      </View>
    </ScrollView>
  )
}
