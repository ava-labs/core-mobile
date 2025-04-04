import { ANIMATED, View } from '@avalabs/k2-alpine'
import { useBrowserContext } from 'features/browser/BrowserContext'
import { BrowserControls } from 'features/browser/components/BrowserControls'
import { BrowserSnapshot } from 'features/browser/components/BrowserSnapshot'
import {
  BrowserTab,
  BrowserTabRef
} from 'features/browser/components/BrowserTab'
import { Discover } from 'features/browser/components/Discover'
import React, { useEffect, useMemo, useState } from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
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

  useEffect(() => {
    tabs.forEach(tab => {
      if (browserRefs?.current && !browserRefs.current[tab.id]?.current) {
        browserRefs.current[tab.id] = React.createRef<BrowserTabRef>()
      }
    })
  }, [tabs, browserRefs])

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
    setTabs(prev =>
      prev.filter(prevTab => allTabs.some(tab => tab.id === prevTab.id))
    )
  }, [allTabs])

  const renderTabs = useMemo(() => {
    return tabs.map(tab => {
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
            pointerEvents: tab.id === activeTab?.id ? 'auto' : 'none',
            opacity: tab.id === activeTab?.id ? 1 : 0
          }}>
          <BrowserTab
            ref={browserRefs.current?.[tab.id]} // Ensure the ref is passed here
            tabId={tab.id}
            disabled={tab.id !== activeTab?.id}
          />
        </View>
      )
    })
  }, [activeTab?.id, browserRefs, tabs])

  const discoverStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showEmptyTab ? 1 : 0, ANIMATED.TIMING_CONFIG),
      pointerEvents: showEmptyTab ? 'auto' : 'none'
    }
  })

  const tabsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showEmptyTab ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  return (
    <BrowserSnapshot>
      <Animated.View
        style={[
          discoverStyle,
          {
            height: '100%',
            zIndex: showEmptyTab ? 1 : -1,
            pointerEvents: showEmptyTab ? 'auto' : 'none'
          }
        ]}>
        <Discover />
      </Animated.View>

      <Animated.View
        style={[
          tabsStyle,
          {
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: showEmptyTab ? -1 : 0,
            pointerEvents: showEmptyTab ? 'none' : 'auto'
          }
        ]}>
        {renderTabs}
      </Animated.View>

      <BrowserControls />
    </BrowserSnapshot>
  )
}

export default Browser
