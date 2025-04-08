import {
  Icons,
  Pressable,
  SCREEN_WIDTH,
  Text,
  View,
  alpha,
  showAlert,
  useTheme
} from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
import { useBrowserContext } from 'features/browser/BrowserContext'
import { TabItem } from 'features/browser/components/TabItem'
import { HORIZONTAL_MARGIN } from 'features/browser/consts'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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

enum MenuId {
  CloseAll = 'Close All',
  ViewHistory = 'View History'
}

const DEFAULT_HEADER_HEIGHT = Platform.select({
  ios: 44,
  android: 56,
  default: 56
})
const NUMBER_OF_COLUMNS = 2
const TAB_WIDTH = (SCREEN_WIDTH - HORIZONTAL_MARGIN) / NUMBER_OF_COLUMNS
const MENU_ACTIONS: DropdownItem[] = [
  {
    id: MenuId.CloseAll,
    title: 'Close all tabs',
    icon: {
      ios: 'xmark',
      android: 'xmark_24px'
    },
    destructive: true
  },
  {
    id: MenuId.ViewHistory,
    title: 'Browsing history',
    icon: {
      ios: 'clock.arrow.circlepath',
      android: 'history_24px'
    }
  }
]

const TabsScreen = (): JSX.Element => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
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

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      switch (nativeEvent.event) {
        case MenuId.CloseAll:
          handleCloseAll()
          break
        case MenuId.ViewHistory: {
          handleViewHistory()
          break
        }
      }
    },
    [handleCloseAll, handleViewHistory]
  )

  const headerRight = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          height: '100%'
        }}>
        <Pressable
          onPress={handleAddTab}
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6
          }}>
          <Icons.Content.Add color={theme.colors.$textPrimary} />
        </Pressable>

        <DropdownMenu
          style={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 6,
            paddingRight: 21
          }}
          onPressAction={onPressAction}
          groups={[{ id: 'menu-actions', items: MENU_ACTIONS }]}>
          <View>
            <Icons.Navigation.MoreHoriz color={theme.colors.$textPrimary} />
          </View>
        </DropdownMenu>
      </View>
    )
  }, [handleAddTab, onPressAction, theme.colors.$textPrimary])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          paddingHorizontal: HORIZONTAL_MARGIN / 2,
          marginBottom: 26
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
    <View style={{ flex: 1 }}>
      <FlashList
        data={sortedTabs}
        contentContainerStyle={{
          paddingTop: insets.top + DEFAULT_HEADER_HEIGHT,
          paddingBottom: tabBarHeight + DEFAULT_HEADER_HEIGHT,
          paddingHorizontal: HORIZONTAL_MARGIN / 2
        }}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        estimatedItemSize={TAB_WIDTH * 1.2}
        numColumns={NUMBER_OF_COLUMNS}
        keyExtractor={item => item.id}
      />

      <View
        style={{
          position: 'absolute',
          height: insets.top + DEFAULT_HEADER_HEIGHT,
          paddingTop: insets.top,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          alignItems: 'flex-end'
        }}>
        <View style={{ zIndex: 1 }}>{headerRight()}</View>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}>
          <BlurredBackgroundView
            backgroundColor={alpha(theme.colors.$surfacePrimary, 0.6)}
          />
        </View>
      </View>
    </View>
  )
}

export default TabsScreen
