import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
  NavigationState,
  SceneRendererProps,
  TabBar,
  TabBarItemProps,
  TabView
} from 'react-native-tab-view'
import { Dimensions, View } from 'react-native'
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

type TabViewAvaFC = FC<{
  renderCustomLabel?: (
    title: string,
    selected: boolean,
    color: string
  ) => React.ReactNode
  currentTabIndex?: number
  testID?: string
  onTabIndexChange?: (tabIndex: number) => void
  lazy?: boolean
}> & { Item: FC<TabViewAvaItemProps> }

/**
 * If there's only one route available TabBar won't be displayed
 */
const TabViewAva: TabViewAvaFC = ({
  renderCustomLabel,
  currentTabIndex = 0,
  onTabIndexChange,
  lazy = true,
  children
}) => {
  const [currentIndex, setCurrentIndex] = useState(currentTabIndex)
  const theme = useApplicationContext().theme

  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  )

  useEffect(() => {
    setCurrentIndex(currentTabIndex)
  }, [currentTabIndex])

  // https://github.com/satya164/react-native-tab-view#tabview-props
  const routes = useMemo(
    () =>
      childrenArray.map((child, index) => {
        const isValidChild =
          React.isValidElement(child) && child.type === TabViewAva.Item
        const title = isValidChild ? child.props.title : index.toString()

        return {
          key: title,
          index: index,
          title: title
        }
      }),
    [childrenArray]
  )

  const navState = useMemo(() => {
    return { index: currentIndex, routes }
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
      }
    ) => {
      return (
        <AvaButton.Base
          key={props.key}
          style={{
            width: props.defaultTabWidth,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={props.onPress}>
          {props.renderLabel?.({
            route: props.route,
            focused: props.navigationState.index === props.route.index,
            color: theme.alternateBackground
          })}
        </AvaButton.Base>
      )
    },
    [theme.alternateBackground]
  )

  //tabBar is hidden if there's only one route
  const tabBar = useCallback(
    (tabBarProps: SceneRendererProps & { navigationState: State }) => {
      return (
        <View style={{ display: routes.length === 1 ? 'none' : 'flex' }}>
          <TabBar
            {...tabBarProps}
            style={{
              elevation: 0,
              shadowOpacity: 0,
              backgroundColor: theme.transparent,
              marginHorizontal: 16
            }}
            renderLabel={({ route, focused, color }) => {
              return renderCustomLabel?.(route?.title ?? '', focused, color)
            }}
            indicatorStyle={{
              backgroundColor: theme.alternateBackground,
              height: 2
            }}
            renderTabBarItem={tabBarItem}
          />
        </View>
      )
    },
    [
      renderCustomLabel,
      routes.length,
      tabBarItem,
      theme.alternateBackground,
      theme.transparent
    ]
  )

  return (
    <TabView
      onIndexChange={handleIndexChange}
      navigationState={navState}
      renderScene={scenes}
      renderTabBar={tabBar}
      lazy={lazy}
      initialLayout={initialLayout}
    />
  )
}

TabViewAva.Item = ({ children }) => <>{children}</>

export default TabViewAva
