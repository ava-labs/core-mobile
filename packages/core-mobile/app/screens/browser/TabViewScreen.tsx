import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser/slices/tabs'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = (activeTab?.historyIds?.length ?? 0) === 0
  const showWebView = !showEmptyTab

  return (
    <View>
      {showEmptyTab && (
        <View>
          <AvaText.LargeTitleBold>EmptyTab</AvaText.LargeTitleBold>
        </View>
      )}
      {showWebView && (
        <View>
          <AvaText.LargeTitleBold>Browser</AvaText.LargeTitleBold>
        </View>
      )}
    </View>
  )
}
