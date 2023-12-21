import React, { useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveTab } from 'store/browser/slices/tabs'
import Browser from 'screens/browser/Browser'
import { Dock } from 'screens/browser/components/Dock'
import { ScrollState } from 'hooks/browser/useScrollHandler'
import { EmptyTab } from 'screens/browser/components/EmptyTab'
import { View } from '@avalabs/k2-mobile'
import { useFocusEffect } from '@react-navigation/native'
import ViewShot from 'react-native-view-shot'
import { TabId } from 'store/browser'
import SnapshotService from 'services/snapshot/SnapshotService'
import { updateSnapshotTimestamp } from 'store/snapshots/slice'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = (activeTab?.historyIds?.length ?? 0) === 0
  const showWebView = !showEmptyTab
  const [dockVisible, setDockVisible] = useState(true)
  const viewShotRef = useRef<ViewShot>(null)
  const dispatch = useDispatch()
  const takeSnapshot = useCallback(
    async (tabId: TabId) => {
      viewShotRef.current?.capture?.().then(async uri => {
        await SnapshotService.saveAs(uri, tabId)

        dispatch(
          updateSnapshotTimestamp({
            id: tabId,
            timestamp: Date.now()
          })
        )
      })
    },
    [dispatch]
  )

  function onNewScrollState(scrollState: ScrollState): void {
    switch (scrollState) {
      case ScrollState.down:
        setDockVisible(false)
        break
      case ScrollState.up:
        setDockVisible(true)
        break
    }
  }

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (activeTab?.id) {
          takeSnapshot(activeTab.id)
        }
      }
    }, [activeTab?.id, takeSnapshot])
  )

  return (
    <ViewShot
      ref={viewShotRef}
      options={{ fileName: activeTab?.id, format: 'jpg', quality: 0.5 }}
      style={{ flex: 1 }}>
      <View sx={{ flex: 1 }}>
        {showEmptyTab && <EmptyTab onNewScrollState={onNewScrollState} />}
        {showWebView && <Browser onNewScrollState={onNewScrollState} />}
        {dockVisible && <Dock />}
      </View>
    </ViewShot>
  )
}
