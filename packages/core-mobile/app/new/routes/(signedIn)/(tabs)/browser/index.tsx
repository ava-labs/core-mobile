import { ANIMATED, View } from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useFocusEffect, useGlobalSearchParams, useRouter } from 'expo-router'
import { useBrowserContext } from 'features/browser/BrowserContext'
import { BrowserControls } from 'features/browser/components/BrowserControls'
import { BrowserSnapshot } from 'features/browser/components/BrowserSnapshot'
import {
  BrowserTab,
  BrowserTabRef
} from 'features/browser/components/BrowserTab'
import { Discover } from 'features/browser/components/Discover'
import { BROWSER_CONTROLS_HEIGHT } from 'features/browser/consts'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import {
  AndroidSoftInputModes,
  KeyboardController
} from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import {
  addHistoryForActiveTab,
  addTab,
  selectActiveTab,
  selectAllTabs,
  selectIsTabEmpty
} from 'store/browser'

const Browser = (): React.ReactNode => {
  const { browserRefs } = useBrowserContext()
  const dispatch = useDispatch()
  const router = useRouter()
  const { deeplinkUrl } = useGlobalSearchParams<{ deeplinkUrl: string }>()
  const activeTab = useSelector(selectActiveTab)
  const allTabs = useSelector(selectAllTabs)
  const showEmptyTab = useSelector(selectIsTabEmpty)

  const tabBarHeight = useBottomTabBarHeight()

  const tabs = useMemo(() => {
    if (!activeTab) return allTabs.slice(0, 5)
    const others = allTabs.filter(tab => tab.id !== activeTab.id).slice(0, 4)
    return [activeTab, ...others]
  }, [allTabs, activeTab])

  useEffect(() => {
    if (deeplinkUrl) {
      dispatch(addTab())
      dispatch(addHistoryForActiveTab({ url: deeplinkUrl, title: '' }))
    }
  }, [dispatch, deeplinkUrl, router])

  useEffect(() => {
    tabs.forEach(tab => {
      if (!browserRefs.current[tab.id]) {
        browserRefs.current[tab.id] = React.createRef<BrowserTabRef>()
      }
    })
  }, [browserRefs, tabs])

  const renderTabs = useCallback(() => {
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
          <BrowserTab ref={browserRefs.current[tab.id]} tabId={tab.id} />
        </View>
      )
    })
  }, [activeTab?.id, browserRefs, tabs])

  const discoverStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showEmptyTab ? 1 : 0, ANIMATED.TIMING_CONFIG)
    }
  })

  const tabsStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showEmptyTab ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  useFocusEffect(() => {
    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_NOTHING
    )
  })

  return (
    <BrowserSnapshot>
      <View
        style={{
          marginBottom: Platform.OS === 'ios' ? tabBarHeight : 0,
          flex: 1
        }}>
        <Animated.View
          style={[
            discoverStyle,
            {
              flex: 1,
              zIndex: showEmptyTab ? 1 : -1,
              pointerEvents: showEmptyTab ? 'auto' : 'none',
              overflow: 'hidden'
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
              bottom: BROWSER_CONTROLS_HEIGHT,
              zIndex: showEmptyTab ? -1 : 1,
              pointerEvents: showEmptyTab ? 'none' : 'auto'
            }
          ]}>
          {renderTabs()}
        </Animated.View>

        <BrowserControls />
      </View>
    </BrowserSnapshot>
  )
}

export default Browser
