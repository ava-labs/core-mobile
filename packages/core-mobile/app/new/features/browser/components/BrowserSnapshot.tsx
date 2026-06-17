import { useFocusEffect } from 'expo-router'
import { ReactNode, useCallback, useRef } from 'react'
import ViewShot, { ViewShotRef } from 'react-native-view-shot'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveTab, TabId } from 'store/browser'
import SnapshotService from 'services/snapshot/SnapshotService'
import { updateSnapshotTimestamp } from 'store/snapshots/slice'

export const BrowserSnapshot = ({
  children
}: {
  children: ReactNode
}): ReactNode => {
  const viewShotRef = useRef<ViewShotRef>(null)
  const dispatch = useDispatch()
  const activeTab = useSelector(selectActiveTab)

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
      {children}
    </ViewShot>
  )
}
