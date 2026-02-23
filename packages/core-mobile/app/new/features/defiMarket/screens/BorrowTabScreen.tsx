import {
  AddCard,
  GRID_GAP,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list'
import {
  getListItemEnteringAnimation,
  getListItemExitingAnimation
} from 'common/utils/animations'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated from 'react-native-reanimated'
import { BorrowProtocolSelector } from '../components/BorrowProtocolSelector'

interface BorrowTabScreenProps {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | number) => void
  onHeaderLayout: (event: LayoutChangeEvent) => void
  animatedHeaderStyle: { opacity: number }
  containerStyle?: StyleProp<ViewStyle>
  isActive: boolean
}

const BorrowTabScreen = ({
  onScroll,
  onHeaderLayout,
  animatedHeaderStyle,
  containerStyle,
  isActive
}: BorrowTabScreenProps): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const scrollOffsetRef = useRef({ x: 0, y: 0 })

  const data: BorrowCardType[] = useMemo(() => {
    // TODO: Add actual borrow data when available
    return [StaticCard.Add]
  }, [])

  const handleAddBorrow = useCallback(() => {
    // TODO: Navigate to borrow flow
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/borrow' })
  }, [navigate])

  const renderItem = useCallback(
    ({
      item,
      index
    }: ListRenderItemInfo<BorrowCardType>): JSX.Element | null => {
      let content = null
      if (item === StaticCard.Add) {
        content = <AddCard width={CARD_WIDTH} onPress={handleAddBorrow} />
      }
      // TODO: Add BorrowCard rendering when available

      if (content) {
        return (
          <Animated.View
            style={{
              marginBottom: 14,
              marginRight: index % 2 === 0 ? 6 : 16,
              marginLeft: index % 2 !== 0 ? 6 : 16
            }}
            entering={getListItemEnteringAnimation(index)}
            exiting={getListItemExitingAnimation(index)}>
            {content}
          </Animated.View>
        )
      }

      return null
    },
    [handleAddBorrow]
  )

  const overrideProps = {
    contentContainerStyle: containerStyle
  }

  const renderHeader = useCallback((): JSX.Element => {
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
              paddingHorizontal: 14,
              marginTop: 6,
              marginBottom: 10,
              backgroundColor: theme.colors.$surfacePrimary,
              gap: 7
            },
            animatedHeaderStyle
          ]}>
          <BorrowProtocolSelector />
          <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
            Take a loan against your deposits and repay anytime.
          </Text>
        </Animated.View>
      </View>
    )
  }, [theme.colors.$surfacePrimary, onHeaderLayout, animatedHeaderStyle])

  useEffect(() => {
    if (scrollOffsetRef.current && isActive) {
      onScroll(scrollOffsetRef.current.y)
    }
  }, [isActive, onScroll])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset
      onScroll(event)
    },
    [onScroll]
  )

  return (
    <FlashList
      onScroll={handleScroll}
      overrideProps={overrideProps}
      data={data}
      numColumns={2}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyExtractor={item =>
        item === StaticCard.Add ? 'add-borrow' : item.uniqueMarketId
      }
      removeClippedSubviews={true}
      extraData={{ isDark: theme.isDark }}
      ListHeaderComponent={renderHeader}
    />
  )
}

enum StaticCard {
  Add = 'Add'
}

// TODO: Replace with actual Borrow type when available
type BorrowItem = { uniqueMarketId: string }
type BorrowCardType = StaticCard | BorrowItem

const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)

export default BorrowTabScreen
