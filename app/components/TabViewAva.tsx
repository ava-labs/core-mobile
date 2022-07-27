import React, { FC, useCallback, useEffect, useState } from 'react'
import {
  TabBar,
  SceneRendererProps,
  TabBarItemProps,
  NavigationState,
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
  renderCustomLabel?: (title: string, selected: boolean) => React.ReactNode
  currentTabIndex?: number
  onTabIndexChange?: (tabIndex: number) => void
  shouldDisableTouch?: boolean
  lazy?: boolean
}> & { Item: FC<TabViewAvaItemProps> }

const TabViewAva: TabViewAvaFC = ({
  renderCustomLabel,
  currentTabIndex = 0,
  onTabIndexChange,
  shouldDisableTouch = false,
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
            flex: 1,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onPress={props.onPress}>
          {props.renderLabel?.({
            route: props.route,
            focused: props.navigationState.index === props.route.index,
            color: 'white'
          })}
        </AvaButton.Base>
      )
    },
    []
  )

  const tabbar = useCallback(
    (tabBarProps: SceneRendererProps & { navigationState: State }) => {
      return (
        <View>
          <TabBar
            {...tabBarProps}
            style={{
              opacity: shouldDisableTouch ? 0.4 : 1,
              elevation: 0,
              shadowOpacity: 0,
              backgroundColor: theme.transparent,
              marginHorizontal: 16
            }}
            renderLabel={({ route, focused }) =>
              renderCustomLabel?.(route?.title ?? '', focused)
            }
            indicatorStyle={{
              backgroundColor: theme.alternateBackground,
              height: 2
            }}
            renderTabBarItem={tabBarItem}
            onTabPress={({ preventDefault }) => {
              shouldDisableTouch && preventDefault()
            }}
          />
        </View>
      )
    },
    [shouldDisableTouch]
  )

  useEffect(() => {
    // when touch is disabled, first tab will be the default active tab
    if (shouldDisableTouch) {
      handleIndexChange(0)
    }
  }, [handleIndexChange, shouldDisableTouch])

  return (
    <TabView
      onIndexChange={handleIndexChange}
      navigationState={{ index: currentIndex, routes }}
      renderScene={scenes}
      renderTabBar={tabbar}
      lazy={shouldDisableTouch || lazy}
    />
  )
}

TabViewAva.Item = ({ children }) => <>{children}</>

export default TabViewAva
