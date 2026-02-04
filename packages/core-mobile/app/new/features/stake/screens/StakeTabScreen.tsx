import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { DropdownSelections } from 'common/components/DropdownSelections'
import React, { useCallback } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import {
  StakeCardList,
  StakeCardListHeaderProps
} from '../components/StakeCardList'
import { Banner } from '../components/Banner'

const StakeTabScreen = ({
  onScroll,
  onHeaderLayout,
  animatedHeaderStyle,
  containerStyle,
  isActive
}: {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  onHeaderLayout: (event: LayoutChangeEvent) => void
  animatedHeaderStyle: { opacity: number }
  containerStyle?: StyleProp<ViewStyle>
  isActive: boolean
}): JSX.Element => {
  const { theme } = useTheme()

  const renderHeader = useCallback(
    ({ isEmpty, filter, sort }: StakeCardListHeaderProps): JSX.Element => {
      return (
        <View
          sx={{
            backgroundColor: theme.colors.$surfacePrimary,
            paddingBottom: 16
          }}>
          <Animated.View
            onLayout={onHeaderLayout}
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
    [theme.colors.$surfacePrimary, onHeaderLayout, animatedHeaderStyle]
  )

  return (
    <StakeCardList
      onScroll={onScroll}
      containerStyle={containerStyle}
      isActive={isActive}
      renderHeader={renderHeader}
    />
  )
}

export default StakeTabScreen
