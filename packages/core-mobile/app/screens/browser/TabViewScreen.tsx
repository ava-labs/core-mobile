import React, { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveTab, selectIsTabEmpty } from 'store/browser/slices/tabs'
import { EmptyTab } from 'screens/browser/components/EmptyTab'
import { View } from '@avalabs/k2-mobile'
import { useFocusEffect } from '@react-navigation/native'
import ViewShot from 'react-native-view-shot'
import { TabId } from 'store/browser'
import SnapshotService from 'services/snapshot/SnapshotService'
import { updateSnapshotTimestamp } from 'store/snapshots/slice'
import useBrowserPool from './useBrowserPool'

export default function TabViewScreen(): JSX.Element {
  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = useSelector(selectIsTabEmpty)
  const showWebView = !showEmptyTab
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

  const { browsers } = useBrowserPool()

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
        {showEmptyTab && <EmptyTab />}
        <View sx={{ display: showWebView ? 'flex' : 'none', flex: 1 }}>
          {browsers}
        </View>
      </View>
    </ViewShot>
  )
}
