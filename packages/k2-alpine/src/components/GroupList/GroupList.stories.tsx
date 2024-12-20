import React, { useState } from 'react'
import { Switch } from 'react-native'
import { ScrollView, View } from '../Primitives'
import { showAlert, useTheme } from '../..'
import { GroupList } from './GroupList'

export default {
  title: 'GroupList'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [booleanValue, setBooleanValue] = useState(true)

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 32, gap: 16 }}>
        <GroupList
          data={[
            {
              title: 'Title 1',
              value: 'Pressable',
              onPress: () => {
                showAlert({ title: 'Pressed', buttons: [{ text: 'OK' }] })
              }
            },
            { title: 'Title 2', value: 'Not pressable' },
            {
              title: 'Title 3',
              accessory: (
                <Switch
                  value={booleanValue}
                  onValueChange={value => setBooleanValue(value)}
                />
              )
            }
          ]}
        />
        <GroupList
          data={[
            {
              title: 'Title 4',
              value: 'Pressable',
              onPress: () => {
                showAlert({ title: 'Pressed', buttons: [{ text: 'OK' }] })
              }
            }
          ]}
        />
      </View>
    </ScrollView>
  )
}
