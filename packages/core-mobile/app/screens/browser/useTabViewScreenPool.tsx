import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Tab, selectActiveTab, selectAllTabs } from 'store/browser'
import TabViewScreen from './TabViewScreen'

const MAX_POOL_SIZE = 5

type TabViewScreenPoolItem = { tab: Tab; tabViewScreen: JSX.Element }

function useTabViewScreenPool(): {
  tabViewScreen: JSX.Element | null
} {
  const activeTab = useSelector(selectActiveTab)
  const allTabs = useSelector(selectAllTabs)

  const [poolItems, setPoolItems] = useState<TabViewScreenPoolItem[]>([])

  function sortTabViewPoolItems(
    screens: TabViewScreenPoolItem[]
  ): TabViewScreenPoolItem[] {
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
          tabViewScreen: <TabViewScreen tabId={activeTab.id} />
        })
      } else {
        const cachedTabViewScreen = updatedPoolItems[index]?.tabViewScreen
        if (cachedTabViewScreen) {
          // Update existing pool item
          updatedPoolItems[index] = {
            tab: activeTab,
            tabViewScreen: cachedTabViewScreen
          }
        }
      }

      // Sort pool items based on lastVisited, for LRU behavior
      return sortTabViewPoolItems(updatedPoolItems)
    })
  }, [activeTab])

  return {
    tabViewScreen:
      poolItems.find(poolItem => poolItem.tab.id === activeTab?.id)
        ?.tabViewScreen ?? null
  }
}

export default useTabViewScreenPool
