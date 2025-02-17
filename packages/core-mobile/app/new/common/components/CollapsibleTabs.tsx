import React, { forwardRef } from 'react'
import {
  CollapsibleRef,
  Tabs,
  useCurrentTabScrollY
} from 'react-native-collapsible-tab-view'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'

export const CollapsibleTabsContainer = forwardRef<
  CollapsibleRef,
  {
    renderHeader: () => JSX.Element
    renderTabBar: () => JSX.Element
    onIndexChange?: (index: number) => void
    onScroll?: (contentOffsetY: number) => void
    tabs: { tabName: string; component: JSX.Element }[]
  }
>(
  (
    { tabs, renderHeader, renderTabBar, onIndexChange, onScroll },
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
              onScroll={onScroll}
            />
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    )
  }
)

const CollapsibleTabWrapper = ({
  component,
  onScroll
}: {
  component: JSX.Element
  onScroll?: (contentOffsetY: number) => void
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()

  useAnimatedReaction(
    () => scrollY.value,
    (curr, prev) => {
      if (curr !== prev && onScroll) {
        runOnJS(onScroll)(scrollY.value)
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
