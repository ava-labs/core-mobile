import React, { forwardRef } from 'react'
import {
  CollapsibleRef,
  TabBarProps,
  Tabs,
  useAnimatedTabIndex,
  useCurrentTabScrollY
} from 'react-native-collapsible-tab-view'
import {
  runOnJS,
  useAnimatedReaction,
  SharedValue
} from 'react-native-reanimated'

export const CollapsibleTabsContainer = forwardRef<
  CollapsibleRef,
  {
    renderHeader: () => JSX.Element
    renderTabBar: (props: TabBarProps) => JSX.Element
    onIndexChange?: (index: number) => void
    onScrollTab?: (tabIndex: SharedValue<number>) => void
    onScrollY?: (contentOffsetY: number) => void
    tabs: { tabName: string; component: JSX.Element }[]
  }
>(
  (
    { tabs, renderHeader, renderTabBar, onIndexChange, onScrollTab, onScrollY },
    ref
  ): JSX.Element => {
    return (
      <Tabs.Container
        ref={ref}
        headerContainerStyle={{
          shadowOpacity: 0,
          elevation: 0,
          overflow: 'visible'
        }}
        containerStyle={{ overflow: 'visible' }}
        renderHeader={renderHeader}
        renderTabBar={renderTabBar}
        pagerProps={{ style: { overflow: 'visible' } }}
        onIndexChange={onIndexChange}>
        {tabs.map(tab => (
          <Tabs.Tab key={tab.tabName} name={tab.tabName}>
            <CollapsibleTabWrapper
              component={tab.component}
              onScrollTab={onScrollTab}
              onScrollY={onScrollY}
            />
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    )
  }
)

const CollapsibleTabWrapper = ({
  component,
  onScrollTab,
  onScrollY
}: {
  component: JSX.Element
  onScrollTab?: (tabIndex: SharedValue<number>) => void
  onScrollY?: (contentOffsetY: number) => void
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()
  const tabIndex = useAnimatedTabIndex()

  useAnimatedReaction(
    () => scrollY.get(),
    (curr, prev) => {
      if (curr !== prev && onScrollY) {
        runOnJS(onScrollY)(scrollY.get())
      }
    }
  )

  useAnimatedReaction(
    () => tabIndex.get(),
    (curr, prev) => {
      if (curr !== prev && onScrollTab) {
        runOnJS(onScrollTab)(tabIndex)
      }
    }
  )

  return component
}

export const CollapsibleTabs = {
  Container: CollapsibleTabsContainer,
  Tab: Tabs.Tab,
  FlatList: Tabs.FlatList,
  ScrollView: Tabs.ScrollView
}

export type CollapsibleTabsRef = CollapsibleRef
