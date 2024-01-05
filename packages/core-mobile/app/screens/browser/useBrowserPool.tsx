import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Tab, selectActiveTab, selectAllTabs } from 'store/browser'
import { View } from '@avalabs/k2-mobile'
import { ScrollState } from 'hooks/browser/useScrollHandler'
import Browser from './Browser'

const MAX_POOL_SIZE = 5

type BrowserPoolItem = { tab: Tab; browser: JSX.Element }

function useBrowserPool(onNewScrollState: (scrollState: ScrollState) => void): {
  browsers: JSX.Element[]
} {
  const activeTab = useSelector(selectActiveTab)
  const allTabs = useSelector(selectAllTabs)

  const [poolItems, setPoolItems] = useState<BrowserPoolItem[]>([])

  function sortTabViewPoolItems(screens: BrowserPoolItem[]): BrowserPoolItem[] {
    return screens.sort((a, b) => {
      if (a.tab.lastVisited && b.tab.lastVisited) {
        return a.tab.lastVisited - b.tab.lastVisited
      }
      // If only one of the tabs has a lastVisited timestamp, it should be last
      return a.tab.lastVisited ? 1 : b.tab.lastVisited ? -1 : 0
    })
  }

  useEffect(() => {
    setPoolItems(prevPoolItems =>
      prevPoolItems.filter(poolItem =>
        allTabs.some(tab => tab.id === poolItem.tab.id)
      )
    )
  }, [allTabs])

  // Add or update pool item for the active tab
  useEffect(() => {
    if (!activeTab || !activeTab.activeHistory) return

    setPoolItems(prevPoolItems => {
      const newPoolItems = [...prevPoolItems]

      const item = newPoolItems.find(
        poolItem => poolItem.tab.id === activeTab.id
      )

      if (item) {
        const index = newPoolItems.findIndex(
          poolItem => poolItem.tab.id === item.tab.id
        )
        if (index !== -1) {
          newPoolItems.splice(index, 1)
        }
        newPoolItems.push({
          tab: activeTab,
          browser: item.browser
        })
      } else {
        if (newPoolItems.length >= MAX_POOL_SIZE) {
          // Remove least recently visited pool item
          newPoolItems.splice(0, 1)
        }

        // Add new pool item
        newPoolItems.push({
          tab: activeTab,
          browser: (
            <Browser tabId={activeTab.id} onNewScrollState={onNewScrollState} />
          )
        })
      }

      // Sort pool items based on lastVisited, for LRU behavior
      return sortTabViewPoolItems(newPoolItems)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return {
    browsers: poolItems.map(poolItem => {
      return (
        <View
          key={poolItem.tab.id}
          sx={{
            flex: 1,
            display: poolItem.tab.id === activeTab?.id ? 'flex' : 'none'
          }}>
          {poolItem.browser}
        </View>
      )
    })
  }
}

export default useBrowserPool
