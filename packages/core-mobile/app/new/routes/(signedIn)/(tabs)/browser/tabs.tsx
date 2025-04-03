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
import { useBrowserContext } from 'features/browser/BrowserContext'
import { TabItem } from 'features/browser/components/TabItem'
import { TabsToolbarMenu } from 'features/browser/components/TabsToolbarMenu'
import { HORIZONTAL_MARGIN } from 'features/browser/consts'
import React, { useCallback, useEffect } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
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

const GRID_GAP = 20
const NUMBER_OF_COLUMNS = 2

const TabsScreen = (): JSX.Element => {
  const { goBack, setOptions, navigate } = useNavigation()
  const { setUrlEntry, handleClearAndFocus } = useBrowserContext()
  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const { theme } = useTheme()
  const tabs = useSelector(selectAllTabs)
  const dispatch = useDispatch()
  const snapshotTimestamps = useSelector(selectAllSnapshotTimestamps)

  const sortedTabs = tabs.sort((a, b) => (a.createdAt - b?.createdAt ? -1 : 1))

  const itemWidth = (SCREEN_WIDTH - HORIZONTAL_MARGIN) / NUMBER_OF_COLUMNS

  const handleAddTab = useCallback(() => {
    handleClearAndFocus()
    dispatch(addTab())
    goBack()
  }, [dispatch, goBack, handleClearAndFocus])

  async function handleCloseTab(tab: Tab): Promise<void> {
    const isDeletingLastTab = sortedTabs.length === 1

    dispatch(removeTab({ id: tab.id }))
    dispatch(deleteSnapshotTimestamp({ id: tab.id }))
    await SnapshotService.delete(tab.id)

    if (isDeletingLastTab) {
      goBack()
    }
  }

  function handlePressTab(tab: Tab): void {
    dispatch(setActiveTabId({ id: tab.id }))
    if (tab.activeHistory) {
      dispatch(addHistoryForActiveTab(tab.activeHistory))
    }
    setUrlEntry(tab.activeHistory?.url ?? '')
    goBack()
  }

  const handleConfirmCloseAll = useCallback(async (): Promise<void> => {
    dispatch(removeAllTabs())
    dispatch(deleteAllSnapshotTimestamps())

    await Promise.all(tabs.map(tab => SnapshotService.delete(tab.id)))

    goBack()
  }, [dispatch, goBack, tabs])

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
    navigate('history')
  }, [navigate])

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
    setOptions({
      headerRight,
      headerLeft: null,
      headerTransparent: true
    })
  }, [headerRight, setOptions])

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
        title={activeHistory?.title ?? 'Main page'}
        imagePath={imagePath}
        onVerifyImagePath={SnapshotService.exists}
        onPress={() => handlePressTab(item)}
        onClose={() => handleCloseTab(item)}
        style={{
          width: itemWidth,
          height: itemWidth * 1.2,
          paddingHorizontal: HORIZONTAL_MARGIN / 2
        }}
      />
    )
  }

  return (
    <FlatList
      data={sortedTabs}
      contentContainerStyle={{
        gap: GRID_GAP,
        paddingBottom: tabBarHeight + 26,
        paddingTop: headerHeight + 26,
        paddingHorizontal: HORIZONTAL_MARGIN / 2
      }}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      ListHeaderComponent={
        <View
          style={{
            paddingHorizontal: HORIZONTAL_MARGIN / 2
          }}>
          <Text variant="heading2">
            {sortedTabs.length} {sortedTabs.length === 1 ? 'tab' : 'tabs'}
          </Text>
        </View>
      }
      numColumns={NUMBER_OF_COLUMNS}
      keyExtractor={item => item.id}
    />
  )
}

export default TabsScreen
