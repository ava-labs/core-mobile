import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  NavigationState,
  SceneRendererProps,
  TabBar,
  TabBarItemProps,
  TabView
} from 'react-native-tab-view'
import { Dimensions, Platform, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'

const initialLayout = { width: Dimensions.get('window').width }

type Route = {
  index: number
  key: string
  title: string
}

type State = NavigationState<Route>

type TabViewAvaItemProps = {
  title: string
  testID?: string
}

type TabViewAvaFC = FC<
  {
    renderLabel: (
      title: string,
      selected: boolean,
      color: string,
      testID?: string
    ) => React.ReactNode
    currentTabIndex?: number
    testID?: string
    onTabIndexChange?: (tabIndex: number) => void
    lazy?: boolean
    hideSingleTab?: boolean
  } & PropsWithChildren
> & { Item: FC<TabViewAvaItemProps & PropsWithChildren> }

/**
 * If there's only one route available TabBar won't be displayed
 */
const TabViewAva: TabViewAvaFC = ({
  renderLabel,
  currentTabIndex = 0,
  onTabIndexChange,
  lazy = true,
  hideSingleTab = true,
  children,
  testID
}) => {
  const theme = useApplicationContext().theme

  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  )
  const [currentIndex, setCurrentIndex] = useState(
    currentTabIndex >= childrenArray.length ? 0 : currentTabIndex
  )

  useEffect(() => {
    setCurrentIndex(currentTabIndex)
  }, [currentTabIndex])
  // https://github.com/satya164/react-native-tab-view#tabview-props
  const routes = useMemo(
    () =>
      childrenArray.map((child, index) => {
        const title =
          React.isValidElement(child) &&
          (child.type as FC).displayName === TabViewAvaItemDisplayName
            ? child.props.title
            : index.toString()

        return {
          key: title,
          index: index,
          title: title
        }
      }),
    [childrenArray]
  )

  useEffect(() => {
    setCurrentIndex(0)
    onTabIndexChange?.(0)
  }, [childrenArray.length, onTabIndexChange])

  const navState = useMemo(() => {
    return {
      index: currentIndex,
      routes
    }
  }, [currentIndex, routes])

  const scenes = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sceneProps: any) => {
      return childrenArray[sceneProps.route.index]
    },
    [childrenArray]
  )

  const handleIndexChange = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      onTabIndexChange?.(index)
    },
    [onTabIndexChange]
  )

  const tabBarItem = useCallback(
    (
      props: TabBarItemProps<Route> & {
        key: string
        testID?: string
      }
    ) => {
      return (
        <AvaButton.Base
          testID={testID}
          key={props.key}
          style={{
            width: props.defaultTabWidth,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={props.onPress}>
          {renderLabel?.(
            props.route.title,
            props.navigationState.index === props.route.index,
            theme.alternateBackground
          )}
        </AvaButton.Base>
      )
    },
    [testID, theme.alternateBackground, renderLabel]
  )

  //tabBar is hidden if there's only one route
  const tabBar = useCallback(
    (tabBarProps: SceneRendererProps & { navigationState: State }) => {
      return (
        <View
          style={{
            display: routes.length === 1 && hideSingleTab ? 'none' : 'flex'
          }}>
          <TabBar
            {...tabBarProps}
            style={{
              elevation: 0,
              shadowOpacity: 0,
              backgroundColor: theme.transparent,
              marginHorizontal: 16
            }}
            contentContainerStyle={{
              marginBottom: 8
            }}
            indicatorStyle={{
              backgroundColor: theme.colorPrimary1,
              height: 2
            }}
            renderTabBarItem={tabBarItem}
          />
          <View
            style={{
              height: 1,
              backgroundColor: theme.colorStroke
            }}
          />
        </View>
      )
    },
    [
      hideSingleTab,
      routes.length,
      tabBarItem,
      theme.colorPrimary1,
      theme.colorStroke,
      theme.transparent
    ]
  )

  return (
    <TabView
      // iOS: Disable animation when switching tabs by tapping on the tab
      // to avoid the UI freeze issue on iOS
      // related github issue: https://github.com/react-navigation/react-navigation/issues/11596
      animationEnabled={Platform.OS !== 'ios'}
      onIndexChange={handleIndexChange}
      navigationState={navState}
      renderScene={scenes}
      renderTabBar={tabBar}
      lazy={lazy}
      initialLayout={initialLayout}
      testID={testID}
    />
  )
}

TabViewAva.Item = ({ children }) => <>{children}</>

const TabViewAvaItemDisplayName = 'TabViewAva.Item'
TabViewAva.Item.displayName = TabViewAvaItemDisplayName

export default TabViewAva
