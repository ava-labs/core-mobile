import {
  Button,
  Icons,
  Pressable,
  Sx,
  Text,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { FlatList, LayoutChangeEvent } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  addTab,
  removeTab,
  setActiveTabId,
  selectAllTabs,
  Tab
} from 'store/browser'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import TabsListToolbarMenu from './components/TabsListToolbarMenu'
import TabListItem from './components/TabListItem'
import { removeProtocol } from './utils'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

function TabsListScreen(): JSX.Element {
  const navigation = useNavigation<TabViewNavigationProp>()
  const {
    theme: { colors }
  } = useTheme()
  const tabs = useSelector(selectAllTabs)
  const dispatch = useDispatch()
  const [width, setWidth] = useState(0)

  const itemWidth = Math.floor(
    (width - GRID_ITEM_MARGIN_HORIZONTAL * (NUMBER_OF_COLUMNS + 1)) /
      NUMBER_OF_COLUMNS
  )

  function handleAdd(): void {
    dispatch(addTab())

    navigation.goBack()
  }

  function handleCloseAll(): void {
    navigation.navigate(AppNavigation.Root.BrowserTabCloseAll)
  }

  function handleCloseTab(tab: Tab): void {
    dispatch(removeTab({ id: tab.id }))
  }

  function handleViewHistory(): void {
    navigation.goBack()

    navigation.navigate(AppNavigation.Browser.History)
  }

  function handleDone(): void {
    navigation.goBack()
  }

  function handleLayout({ nativeEvent }: LayoutChangeEvent): void {
    setWidth(nativeEvent.layout.width)
  }

  function handlePressTab(tab: Tab): void {
    dispatch(setActiveTabId({ id: tab.id }))

    navigation.goBack()
  }

  function renderTab({ item }: { item: Tab }): JSX.Element | null {
    const activeHistory = item.activeHistory

    return (
      <View
        sx={{
          width: itemWidth,
          marginRight: GRID_ITEM_MARGIN_HORIZONTAL,
          marginBottom: GRID_ITEM_MARGIN_VERTICAL
        }}>
        <TabListItem
          title={activeHistory?.url ? removeProtocol(activeHistory.url) : ''}
          onPress={() => handlePressTab(item)}
          onClose={() => handleCloseTab(item)}
        />
      </View>
    )
  }

  function renderHeader(): JSX.Element {
    return (
      <Text
        variant="heading5"
        sx={{ marginBottom: 16 }}>{`${tabs.length} Tabs`}</Text>
    )
  }

  function renderToolbar(): JSX.Element {
    return (
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <TabsListToolbarMenu
          onCloseAll={handleCloseAll}
          onViewHistory={handleViewHistory}>
          <ToolbarButton sx={{ paddingHorizontal: 16 }}>
            <Icons.Navigation.MoreHoriz
              color={colors.$white}
              width={TOOLBAR_ICON_SIZE}
              height={TOOLBAR_ICON_SIZE}
            />
          </ToolbarButton>
        </TabsListToolbarMenu>
        <ToolbarButton
          sx={{
            position: 'absolute',
            left: '50%',
            marginLeft: -TOOLBAR_ICON_SIZE / 2
          }}
          onPress={handleAdd}>
          <Icons.Content.Add
            color={colors.$white}
            width={TOOLBAR_ICON_SIZE}
            height={TOOLBAR_ICON_SIZE}
          />
        </ToolbarButton>
        <Button
          type="tertiary"
          size="xlarge"
          style={{ paddingHorizontal: 8 }}
          onPress={handleDone}>
          Done
        </Button>
      </View>
    )
  }

  return (
    <>
      <FlatList
        data={tabs}
        contentContainerStyle={{
          paddingHorizontal: GRID_ITEM_MARGIN_HORIZONTAL
        }}
        renderItem={renderTab}
        ListHeaderComponent={renderHeader()}
        numColumns={NUMBER_OF_COLUMNS}
        onLayout={handleLayout}
      />
      {renderToolbar()}
    </>
  )
}

function ToolbarButton({
  sx,
  onPress,
  children
}: {
  sx?: Sx
  onPress?: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <Pressable sx={sx} hitSlop={16} onPress={onPress}>
      {({ pressed }) => (
        <View
          sx={{
            opacity: pressed ? 0.5 : 1
          }}>
          {children}
        </View>
      )}
    </Pressable>
  )
}

const TOOLBAR_ICON_SIZE = 32
const GRID_ITEM_MARGIN_HORIZONTAL = 16
const GRID_ITEM_MARGIN_VERTICAL = 24
const NUMBER_OF_COLUMNS = 2

export default TabsListScreen
