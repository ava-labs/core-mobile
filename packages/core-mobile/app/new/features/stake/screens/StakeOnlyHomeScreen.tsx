import { NavigationTitleHeader, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import {
  StakeCardList,
  StakeCardListHeaderProps
} from '../components/StakeCardList'
import { Banner } from '../components/Banner'

export const StakeOnlyHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const headerHeight = useHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const { theme } = useTheme()

  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const header = useMemo(() => <NavigationTitleHeader title={'Stake'} />, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: headerLayout,
    hasSeparator: false
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const tabHeight = useMemo(() => {
    return frame.height - headerHeight
  }, [frame.height, headerHeight])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: tabBarHeight + 32,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [tabBarHeight, tabHeight])

  const renderHeader = useCallback(
    ({ isEmpty, filter, sort }: StakeCardListHeaderProps): JSX.Element => {
      return (
        <View
          sx={{
            backgroundColor: theme.colors.$surfacePrimary,
            paddingBottom: 16
          }}>
          <Animated.View
            onLayout={handleHeaderLayout}
            style={[
              {
                paddingHorizontal: 16,
                marginTop: 6,
                marginBottom: 16,
                backgroundColor: theme.colors.$surfacePrimary,
                gap: 7
              },
              animatedHeaderStyle
            ]}>
            <Text variant="heading2">Stake</Text>
            {isEmpty && (
              <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
                Lock AVAX in the network for a set period of time and generate
                staking rewards.
              </Text>
            )}
          </Animated.View>
          {isEmpty === false && <Banner />}
          <DropdownSelections
            filter={filter}
            sort={sort}
            sx={{ paddingHorizontal: 16, marginTop: 20 }}
          />
        </View>
      )
    },
    [theme.colors.$surfacePrimary, handleHeaderLayout, animatedHeaderStyle]
  )

  return (
    <BlurredBarsContentLayout>
      <StakeCardList
        onScroll={onScroll}
        containerStyle={contentContainerStyle}
        renderHeader={renderHeader}
      />
    </BlurredBarsContentLayout>
  )
}
