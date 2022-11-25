import React, { FC, useCallback, useEffect, useState } from 'react'
import {
  NavigationState,
  SceneRendererProps,
  TabBar,
  TabBarItemProps,
  TabView
} from 'react-native-tab-view'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'

type Route = {
  index: number
  key: string
  title: string
}

type State = NavigationState<Route>

type TabViewAvaItemProps = {
  title: string
}

type TabViewAvaFC = FC<{
  renderCustomLabel?: (
    title: string,
    selected: boolean,
    color: string
  ) => React.ReactNode
  currentTabIndex?: number
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

  const childrenArray = React.Children.toArray(children)

  useEffect(() => {
    setCurrentIndex(currentTabIndex)
  }, [currentTabIndex])

  // https://github.com/satya164/react-native-tab-view#tabview-props
  const routes = childrenArray.map((child, index) => {
    const isValidChild =
      React.isValidElement(child) && child.type === TabViewAva.Item
    const title = isValidChild ? child.props.title : index.toString()

    return {
      key: title,
      index: index,
      title: title
    }
  })

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
      navigationState={{ index: currentIndex, routes }}
      renderScene={scenes}
      renderTabBar={tabBar}
      lazy={lazy}
    />
  )
}

TabViewAva.Item = ({ children }) => <>{children}</>

export default TabViewAva
