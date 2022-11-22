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
  enableFirstTabOnly?: boolean
  lazy?: boolean
}> & { Item: FC<TabViewAvaItemProps> }

const TabViewAva: TabViewAvaFC = ({
  renderCustomLabel,
  currentTabIndex = 0,
  onTabIndexChange,
  enableFirstTabOnly = false,
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
            color:
              enableFirstTabOnly && props.route.index !== 0
                ? theme.colorDisabled
                : theme.alternateBackground
          })}
        </AvaButton.Base>
      )
    },
    [enableFirstTabOnly, theme.alternateBackground, theme.colorDisabled]
  )

  const tabbar = useCallback(
    (tabBarProps: SceneRendererProps & { navigationState: State }) => {
      return (
        <View>
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
            onTabPress={({ preventDefault }) => {
              enableFirstTabOnly && preventDefault()
            }}
          />
        </View>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enableFirstTabOnly]
  )

  useEffect(() => {
    // when touch is disabled, first tab will be the default active tab
    if (enableFirstTabOnly) {
      handleIndexChange(0)
    }
  }, [handleIndexChange, enableFirstTabOnly])

  return (
    <TabView
      swipeEnabled={!enableFirstTabOnly}
      onIndexChange={handleIndexChange}
      navigationState={{ index: currentIndex, routes }}
      renderScene={scenes}
      renderTabBar={tabbar}
      lazy={enableFirstTabOnly || lazy}
    />
  )
}

TabViewAva.Item = ({ children }) => <>{children}</>

export default TabViewAva
