import { FlatList, Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Dimensions } from 'react-native'
import { SUGGESTED_ITEMS, SuggestedItem } from 'store/browser/const'
import { SuggestedListItem } from './SuggestedListItem'

const width = Dimensions.get('window').width

export const SuggestedSection = (): JSX.Element | null => {
  // get each item gap, 32 is horizontal padding, 64 is item width, 3 is number of gap in a row
  const itemGap = (width - 32 - 64 * 4) / 3

  return (
    <View>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16
        }}>
        <Text variant="heading5">Suggested</Text>
      </View>
      {/* <Space y={16} /> */}
      <FlatList
        scrollEnabled={false}
        data={SUGGESTED_ITEMS}
        renderItem={item => (
          <SuggestedListItem
            suggested={item.item as SuggestedItem}
            marginRight={item.index !== 3 && item.index !== 7 ? itemGap : 0}
          />
        )}
        numColumns={4}
      />
    </View>
  )
}
