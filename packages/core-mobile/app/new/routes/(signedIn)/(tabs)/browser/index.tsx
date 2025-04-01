import { View } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useBrowserContext } from 'features/browser/BrowserContext'
import { BrowserControls } from 'features/browser/components/BrowserControls'
import { BrowserSnapshot } from 'features/browser/components/BrowserSnapshot'
import {
  BrowserTab,
  BrowserTabRef
} from 'features/browser/components/BrowserTab'
import { Discover } from 'features/browser/components/Discover'
import React, { useState, useMemo, useEffect } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useSelector } from 'react-redux'
import {
  selectActiveTab,
  selectAllTabs,
  selectIsTabEmpty,
  Tab
} from 'store/browser'

const Browser = (): React.ReactNode => {
  const { browserRefs } = useBrowserContext()
  const activeTab = useSelector(selectActiveTab)
  const allTabs = useSelector(selectAllTabs)
  const showEmptyTab = useSelector(selectIsTabEmpty)

  const [tabs, setTabs] = useState<Tab[]>([])

  const filteredTabs = useMemo(() => {
    // Sort pool items based on lastVisited, for LRU behavior
    return tabs.sort((a, b) => {
      if (a.lastVisited && b.lastVisited) {
        return a.lastVisited - b.lastVisited
      }
      // If only one of the tabs has a lastVisited timestamp, it should be last
      return a.lastVisited ? 1 : b.lastVisited ? -1 : 0
    })
  }, [tabs])

  // Add or update tab item for the active tab
  useEffect(() => {
    if (!activeTab || !activeTab.activeHistory) return

    setTabs(prev => {
      const newTabs = [...prev]

      let item = newTabs.find(tab => tab.id === activeTab.id)

      if (item) {
        // Update existing pool item
        item = activeTab
      } else {
        if (newTabs.length >= 5) {
          // Remove least recently visited pool item
          newTabs.splice(0, 1)
        }

        // Add new pool item
        newTabs.push(activeTab)
      }

      return newTabs
    })
  }, [activeTab])

  useEffect(() => {
    allTabs.forEach(tab => {
      if (browserRefs?.current && !browserRefs.current[tab.id]?.current) {
        browserRefs.current[tab.id] = React.createRef<BrowserTabRef>()
      }
    })
  }, [allTabs, browserRefs])

  // TODO: Not sure if this is still needed
  // useEffect(() => {
  // Ensure tabs are updated
  // setTabs(prev =>
  //   prev.map(item => ({
  //     ...item,
  //     ...(allTabs.find(tab => tab.id === item.id) || item)
  //   }))
  // )
  // }, [allTabs, browserRefs])

  // TODO: Not sure if this is still needed
  // useEffect(() => {
  //   setTabs(prev =>
  //     prev.filter(prevTab => allTabs.some(tab => tab.id === prevTab.id))
  //   )
  // }, [allTabs])

  return (
    <BlurredBarsContentLayout>
      <BrowserSnapshot>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <View sx={{ flex: 1 }}>
            {showEmptyTab && <Discover />}

            {filteredTabs.map(tab => {
              return (
                <View
                  key={tab.id}
                  sx={{
                    flex: 1,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: tab.id === activeTab?.id ? 0 : -1,
                    pointerEvents: tab.id === activeTab?.id ? 'auto' : 'none'
                  }}>
                  <BrowserTab
                    ref={browserRefs.current?.[tab.id]} // Ensure the ref is passed here
                    tabId={tab.id}
                  />
                </View>
              )
            })}

            <BrowserControls />
          </View>
        </KeyboardAvoidingView>
      </BrowserSnapshot>
    </BlurredBarsContentLayout>
  )
}

export default Browser
