import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import {} from 'react-native-gesture-handler'
import { HScrollView } from 'react-native-head-tab-view'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { PortfolioHomeScreenTab } from 'new/routes/(signedIn)/(tabs)/portfolio'

export const DeFiScreen = ({
  tabIndex,
  onScroll
}: {
  tabIndex: PortfolioHomeScreenTab
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}): JSX.Element => {
  return (
    <HScrollView
      showsVerticalScrollIndicator={false}
      index={tabIndex}
      onScroll={onScroll}
      style={{
        flex: 1
      }}
      contentContainerStyle={{
        flex: 1,
        alignItems: 'center'
      }}>
      <View sx={{ alignItems: 'center', marginTop: 100 }}>
        <Text variant="heading3">Defi</Text>
      </View>
    </HScrollView>
  )
}
