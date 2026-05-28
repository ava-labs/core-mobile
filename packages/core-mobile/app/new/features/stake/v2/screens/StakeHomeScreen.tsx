import {
  AnimatedPressable,
  Chip,
  Icons,
  NavigationTitleHeader,
  ScrollView,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useRouter } from 'expo-router'
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

export const StakeHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const headerHeight = useEffectiveHeaderHeight()
  const tabBarHeight = useBottomTabBarHeight()
  const { theme } = useTheme()
  const { navigate } = useRouter()

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

  const handleSearchPress = useCallback(() => {
    navigate({ pathname: '/stakeSearch' })
  }, [navigate])

  const renderHeader = useCallback(
    ({ isEmpty, filter }: StakeCardListHeaderProps): JSX.Element => {
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
            <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
              Stake your AVAX and earn rewards for securing the Avalanche
              Network
            </Text>
          </Animated.View>
          <Banner />
          {!isEmpty && (
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
                paddingRight: 16,
                gap: 8
              }}>
              <View sx={{ flex: 1 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: 'row',
                    gap: 8,
                    paddingLeft: 16,
                    paddingRight: 8
                  }}>
                  {filter.data[0]?.items.map(item => (
                    <Chip
                      key={item.id}
                      size="large"
                      isSelected={item.id === filter.selected}
                      onPress={() => filter.onSelected(item.id)}
                      style={{ minWidth: 40 }}>
                      {item.title}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
              <AnimatedPressable
                onPress={handleSearchPress}
                accessibilityRole="button"
                accessibilityLabel="Search stakes"
                style={{
                  backgroundColor: theme.colors.$surfaceSecondary,
                  borderRadius: 1000,
                  height: 27,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12
                }}>
                <Icons.Custom.Search
                  color={theme.colors.$textPrimary}
                  width={14}
                  height={14}
                />
                <Text
                  variant="buttonSmall"
                  sx={{ color: theme.colors.$textSecondary }}>
                  Search
                </Text>
              </AnimatedPressable>
            </View>
          )}
        </View>
      )
    },
    [
      theme.colors.$surfacePrimary,
      theme.colors.$surfaceSecondary,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary,
      handleHeaderLayout,
      animatedHeaderStyle,
      handleSearchPress
    ]
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
