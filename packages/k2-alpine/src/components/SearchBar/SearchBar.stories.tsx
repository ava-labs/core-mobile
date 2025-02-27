import React, { useState } from 'react'
import { ScrollView, TouchableOpacity, View } from '../Primitives'
import { Icons, showAlert } from '../..'
import { SearchBar } from './SearchBar'

export default {
  title: 'SearchBar'
}

export const All = (): JSX.Element => {
  const [value, setValue] = useState('')
  const [value1, setValue1] = useState('')

  return (
    <ScrollView
      style={{ width: '100%', backgroundColor: 'transparent' }}
      contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          marginBottom: 20,
          gap: 20
        }}>
        <SearchBar
          onTextChanged={setValue}
          searchText={value}
          placeholder="SearchBar with custom icon"
          rightComponent={
            <TouchableOpacity
              onPress={() =>
                showAlert({
                  title: 'custom icon pressed',
                  buttons: [{ text: 'OK' }]
                })
              }
              hitSlop={16}>
              <Icons.Custom.QRCodeScanner />
            </TouchableOpacity>
          }
        />
        <SearchBar
          onTextChanged={setValue1}
          searchText={value1}
          placeholder="SearchBar without custom icon"
        />
      </View>
    </ScrollView>
  )
}
