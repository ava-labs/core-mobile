import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import {} from 'react-native-gesture-handler'
import { Tabs, useCurrentTabScrollY } from 'react-native-collapsible-tab-view'
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated'

export const DeFiScreen = ({
  onScroll
}: {
  onScroll: (event: number) => void
}): JSX.Element => {
  const scrollY = useCurrentTabScrollY()

  useAnimatedReaction(
    () => scrollY.value,
    (curr, prev) => {
      if (curr !== prev) {
        // Switch from UI thread to JS thread and pass the entire SharedValue
        runOnJS(onScroll)(scrollY.value)
      }
    }
  )

  return (
    <Tabs.ScrollView showsVerticalScrollIndicator={false}>
      <View sx={{ alignItems: 'center', marginTop: 100 }}>
        <Text variant="heading3">Defi</Text>
      </View>
    </Tabs.ScrollView>
  )
}
