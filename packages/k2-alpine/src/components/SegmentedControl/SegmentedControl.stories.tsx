import React, { useState } from 'react'
import { Switch } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { SegmentedControl } from './SegmentedControl'

export default {
  title: 'SegmentedControl'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [dynamicItemWidth, setDynamicItemWidth] = useState(false)

  const ITEMS_LIST = [
    ['Assets', 'Collectibles', 'DeFi'],
    ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
    ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
    ['O', 'My Godness']
  ]

  const toggleDynamicItemWidth = (): void => {
    setDynamicItemWidth(v => !v)
  }

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginBottom: 32, alignItems: 'flex-end' }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Text>Dynamic item width</Text>
          <Switch value={dynamicItemWidth} onChange={toggleDynamicItemWidth} />
        </View>
      </View>
      <View style={{ marginTop: 0, gap: 100 }}>
        {ITEMS_LIST.map((items, index) => (
          <View key={index}>
            <SegmentedControlStory
              items={items}
              dynamicItemWidth={dynamicItemWidth}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const SegmentedControlStory = ({
  items,
  dynamicItemWidth
}: {
  items: string[]
  dynamicItemWidth: boolean
}): JSX.Element => {
  const selectedSegmentIndex = useSharedValue(0)

  return (
    <View
      style={{
        gap: 8,
        alignItems: 'center'
      }}>
      <SegmentedControl
        style={{ width: '100%' }}
        dynamicItemWidth={dynamicItemWidth}
        items={items}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={index => {
          selectedSegmentIndex.value = index
        }}
      />
      <Text variant="body2">
        {items[Math.floor(selectedSegmentIndex.get())]}
      </Text>
    </View>
  )
}
