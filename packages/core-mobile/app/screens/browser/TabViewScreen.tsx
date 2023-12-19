import React, { useState } from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser/slices/tabs'
import Browser from 'screens/browser/Browser'
import { Dock } from 'screens/browser/components/Dock'
import { ScrollState } from 'hooks/browser/useScrollHandler'
import { EmptyTab } from 'screens/browser/components/EmptyTab'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = (activeTab?.historyIds?.length ?? 0) === 0
  const showWebView = !showEmptyTab
  const [dockVisible, setDockVisible] = useState(true)

  function onNewScrollState(scrollState: ScrollState): void {
    switch (scrollState) {
      case ScrollState.down:
        setDockVisible(false)
        break
      case ScrollState.up:
      case ScrollState.idle:
        setDockVisible(true)
        break
    }
  }

  return (
    <View>
      {showEmptyTab && <EmptyTab />}
      {showWebView && <Browser onNewScrollState={onNewScrollState} />}
      {dockVisible && <Dock />}
    </View>
  )
}
