import React, { useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveTab, selectIsTabEmpty } from 'store/browser/slices/tabs'
import { View } from '@avalabs/k2-alpine'
import { useFocusEffect } from '@react-navigation/native'
import ViewShot from 'react-native-view-shot'
import { TabId } from 'store/browser'
import SnapshotService from 'services/snapshot/SnapshotService'
import { updateSnapshotTimestamp } from 'store/snapshots/slice'
import useBrowserPool from '../hooks/useBrowserPool'
import { EmptyTab } from './EmptyTab'

export default function TabViewScreen(): JSX.Element {
  const dispatch = useDispatch()
  const { browsers } = useBrowserPool()

  const activeTab = useSelector(selectActiveTab)
  const showEmptyTab = useSelector(selectIsTabEmpty)
  const viewShotRef = useRef<ViewShot>(null)

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
        <View sx={{ display: !showEmptyTab ? 'flex' : 'none', flex: 1 }}>
          {/* TODO: Make Record, ActiveTab for handling input (maybe refs?) */}
          {/* <BrowserInput
            activeTab={activeTab}
            value={urlEntry}
            placeholder={'Search or type URL'}
            // onRefresh={handleRefresh}
            onChangeText={setUrlEntry}
            onSubmitEditing={handleUrlSubmit}
          /> */}
          {browsers}
        </View>
      </View>
    </ViewShot>
  )
}
