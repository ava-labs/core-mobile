import { NavigationTitleHeader, Text } from '@avalabs/k2-alpine'
import React, { useState } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

const TITLE = 'Show Recovery Phrase'

const navigationHeader = <NavigationTitleHeader title={TITLE} />

const ShowRecoveryPhraseScreen = (): JSX.Element => {
  const headerOpacity = useSharedValue(1)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: navigationHeader,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}
      onScroll={onScroll}>
      {/* Header */}
      <Animated.View
        style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
        onLayout={handleHeaderLayout}>
        <Text variant="heading2">{TITLE}</Text>
      </Animated.View>
    </ScrollView>
  )
}

export default ShowRecoveryPhraseScreen
