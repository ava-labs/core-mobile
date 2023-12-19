import React from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser/slices/tabs'
import Browser from 'screens/browser/Browser'
import { EmptyTab } from './components/EmptyTab'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = (activeTab?.historyIds?.length ?? 0) === 0
  const showWebView = !showEmptyTab

  return (
    <View>
      {showEmptyTab && <EmptyTab />}
      {showWebView && <Browser />}
    </View>
  )
}
