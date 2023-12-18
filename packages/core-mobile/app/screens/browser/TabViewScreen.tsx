import React from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser/slices/tabs'
import { Text } from '@avalabs/k2-mobile'
import Browser from 'screens/browser/Browser'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = (activeTab?.historyIds?.length ?? 0) === 0
  const showWebView = !showEmptyTab

  return (
    <View>
      {showEmptyTab && (
        <View>
          <Text variant="heading3">EmptyTab</Text>
        </View>
      )}
      {showWebView && <Browser />}
    </View>
  )
}
