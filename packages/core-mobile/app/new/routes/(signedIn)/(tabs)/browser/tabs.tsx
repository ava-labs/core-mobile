import {
  AnimatedPressable,
  Icons,
  SCREEN_WIDTH,
  Text,
  View,
  showAlert,
  useTheme
} from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { useBrowserContext } from 'features/browser/BrowserContext'
import { TabItem } from 'features/browser/components/TabItem'
import { TabsToolbarMenu } from 'features/browser/components/TabsToolbarMenu'
import { HORIZONTAL_MARGIN } from 'features/browser/consts'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import SnapshotService from 'services/snapshot/SnapshotService'
import {
  Tab,
  addHistoryForActiveTab,
  addTab,
  removeAllTabs,
  removeTab,
  selectAllTabs,
  setActiveTabId
} from 'store/browser'
import {
  deleteAllSnapshotTimestamps,
  deleteSnapshotTimestamp,
  selectAllSnapshotTimestamps
} from 'store/snapshots/slice'
import Logger from 'utils/Logger'

const NUMBER_OF_COLUMNS = 2
const TAB_WIDTH = (SCREEN_WIDTH - HORIZONTAL_MARGIN) / NUMBER_OF_COLUMNS

const TabsScreen = (): JSX.Element => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const { setUrlEntry, handleClearAndFocus, browserRefs } = useBrowserContext()

  const tabs = useSelector(selectAllTabs)
  const snapshotTimestamps = useSelector(selectAllSnapshotTimestamps)

  const sortedTabs = useMemo(() => [...tabs].reverse(), [tabs])

  const handleAddTab = useCallback(() => {
    handleClearAndFocus()
    dispatch(addTab())
    navigation.goBack()
  }, [dispatch, handleClearAndFocus, navigation])

  function handleCloseTab(tab: Tab): void {
    const isDeletingLastTab = sortedTabs.length === 1

    dispatch(removeTab({ id: tab.id }))
    if (browserRefs.current[tab.id]) {
      delete browserRefs.current[tab.id]
    }

    dispatch(deleteSnapshotTimestamp({ id: tab.id }))
    SnapshotService.delete(tab.id)

    if (isDeletingLastTab) {
      navigation.goBack()
    }
  }

  function handlePressTab(tab: Tab): void {
    dispatch(setActiveTabId({ id: tab.id }))
    if (tab.activeHistory) {
      dispatch(addHistoryForActiveTab(tab.activeHistory))
    }
    setUrlEntry(tab.activeHistory?.url ?? '')
    navigation.goBack()
  }

  const handleConfirmCloseAll = useCallback(async (): Promise<void> => {
    dispatch(removeAllTabs())
    dispatch(deleteAllSnapshotTimestamps())
    setUrlEntry('')
    navigation.goBack()

    Promise.all(
      tabs.map(tab => {
        SnapshotService.delete(tab.id)
        if (browserRefs.current[tab.id]) {
          delete browserRefs.current[tab.id]
        }
      })
    ).catch(Logger.error)
  }, [dispatch, navigation, setUrlEntry, tabs, browserRefs])

  const handleCloseAll = useCallback((): void => {
    showAlert({
      title: 'Close all tabs',
      description: 'This will remove all of your active tabs',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: handleConfirmCloseAll
        }
      ]
    })
  }, [handleConfirmCloseAll])

  const handleViewHistory = useCallback((): void => {
    navigation.navigate('history')
  }, [navigation])

  const headerRight = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 12
        }}>
        <AnimatedPressable
          onPress={handleAddTab}
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }}>
          <Icons.Content.Add color={theme.colors.$textPrimary} />
        </AnimatedPressable>
        <TabsToolbarMenu
          onCloseAll={handleCloseAll}
          onViewHistory={handleViewHistory}>
          <AnimatedPressable
            style={{
              paddingRight: HORIZONTAL_MARGIN
            }}>
            <Icons.Navigation.MoreHoriz color={theme.colors.$textPrimary} />
          </AnimatedPressable>
        </TabsToolbarMenu>
      </View>
    )
  }, [
    handleAddTab,
    handleCloseAll,
    handleViewHistory,
    theme.colors.$textPrimary
  ])

  useEffect(() => {
    navigation.setOptions({
      headerRight,
      headerTransparent: true,
      headerLeft: null
    })
  }, [headerRight, navigation])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          paddingHorizontal: HORIZONTAL_MARGIN / 2,
          marginBottom: HORIZONTAL_MARGIN * 2
        }}>
        <Text variant="heading2">
          {sortedTabs.length} {sortedTabs.length === 1 ? 'tab' : 'tabs'}
        </Text>
      </View>
    )
  }, [sortedTabs.length])

  const renderItem: ListRenderItem<Tab> = ({
    item,
    index
  }): JSX.Element | null => {
    const activeHistory = item.activeHistory

    let imagePath = SnapshotService.getPath(item.id)
    if (snapshotTimestamps[item.id]) {
      imagePath += '?' + snapshotTimestamps[item.id]
    }

    return (
      <TabItem
        index={index}
        title={
          item.activeHistoryIndex > -1
            ? activeHistory?.title.length
              ? activeHistory?.title
              : activeHistory?.url
            : 'Main page'
        }
        imagePath={imagePath}
        onVerifyImagePath={SnapshotService.exists}
        onPress={() => handlePressTab(item)}
        onClose={() => handleCloseTab(item)}
        style={{
          width: TAB_WIDTH,
          height: TAB_WIDTH * 1.2,
          paddingHorizontal: HORIZONTAL_MARGIN / 2,
          marginBottom: 20
        }}
      />
    )
  }

  return (
    <FlashList
      data={sortedTabs}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 26,
        paddingTop: headerHeight + 26,
        paddingHorizontal: HORIZONTAL_MARGIN / 2
      }}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      estimatedItemSize={TAB_WIDTH * 1.2}
      numColumns={NUMBER_OF_COLUMNS}
      keyExtractor={item => item.id}
    />
  )
}

export default TabsScreen
