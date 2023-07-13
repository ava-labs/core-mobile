import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'

const renderCustomLabel = (title: string, selected: boolean, color: string) => {
  return <AvaText.Heading3 textStyle={{ color }}>{title}</AvaText.Heading3>
}

export const ActiveHistory = () => {
  return (
    <TabViewAva renderCustomLabel={renderCustomLabel}>
      <TabViewAva.Item title={'Active'}>
        <View>
          <AvaText.Heading1>Active</AvaText.Heading1>
        </View>
      </TabViewAva.Item>
      <TabViewAva.Item title={'History'}>
        <View>
          <AvaText.Heading1>History</AvaText.Heading1>
        </View>
      </TabViewAva.Item>
    </TabViewAva>
  )
}
