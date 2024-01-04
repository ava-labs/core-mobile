import React, { useEffect, useLayoutEffect, useState } from 'react'
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
      // so that empty tabs are prioritized to be removed from the pool
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
  useLayoutEffect(() => {
    if (!activeTab) return

    setPoolItems(prevPoolItems => {
      const index = prevPoolItems.findIndex(
        poolItem => poolItem.tab.id === activeTab.id
      )

      let updatedPoolItems = [...prevPoolItems]

      if (index === -1) {
        if (updatedPoolItems.length >= MAX_POOL_SIZE) {
          // Remove least recently visited pool item
          updatedPoolItems = updatedPoolItems.slice(1)
        }

        // Add new pool item
        updatedPoolItems.push({
          tab: activeTab,
          browser: (
            <Browser tabId={activeTab.id} onNewScrollState={onNewScrollState} />
          )
        })
      } else {
        const cachedBrowser = updatedPoolItems[index]?.browser
        if (cachedBrowser) {
          // Update existing pool item
          updatedPoolItems[index] = {
            tab: activeTab,
            browser: cachedBrowser
          }
        }
      }

      // Sort pool items based on lastVisited, for LRU behavior
      return sortTabViewPoolItems(updatedPoolItems)
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
