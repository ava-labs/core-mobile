import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { FlashList, FlashListRef, ListRenderItem } from '@shopify/flash-list'
import { useRouter } from 'expo-router'
import React, { useCallback, useRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { MY_POSITIONS_MOCK } from '../mocks'
import { Position } from '../types'
import { PositionCard } from './PositionCard'

interface PositionsProps {
  /**
   * Optional parent-owned ref that persists the horizontal scroll offset
   * across remounts of `Positions`. Pass a stable `useRef(0)` from the
   * parent screen so the carousel position survives header re-renders
   * triggered by filter / sort changes on the surrounding list.
   */
  scrollOffsetRef?: React.RefObject<number>
}

export const Positions = ({
  scrollOffsetRef
}: PositionsProps): JSX.Element | null => {
  const { theme } = useTheme()
  const router = useRouter()

  const positions = MY_POSITIONS_MOCK
  const listRef = useRef<FlashListRef<Position>>(null)

  const keyExtractor = useCallback((item: Position) => item.id, [])

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsPositions')
  }, [router])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (scrollOffsetRef) {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.x
      }
    },
    [scrollOffsetRef]
  )

  // After the list lays out its content, restore the saved offset.
  // Runs once per mount.
  const handleContentSizeChange = useCallback(() => {
    const saved = scrollOffsetRef?.current ?? 0
    if (saved > 0) {
      listRef.current?.scrollToOffset({ offset: saved, animated: false })
    }
  }, [scrollOffsetRef])

  const renderItem: ListRenderItem<Position> = useCallback(
    ({ item, index }) => (
      <AnimatedPressable
        onPress={handlePositionsPress}
        style={{ marginRight: index === positions.length - 1 ? 0 : 12 }}>
        <PositionCard position={item} />
      </AnimatedPressable>
    ),
    [handlePositionsPress, positions.length]
  )

  if (positions.length === 0) {
    return null
  }

  return (
    <View sx={{ gap: 8 }}>
      <Pressable
        onPress={handlePositionsPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          alignSelf: 'flex-start'
        }}>
        <Text variant="heading3">My positions</Text>
        <Icons.Navigation.ChevronRight
          color={alpha(theme.colors.$textPrimary, 0.4)}
        />
      </Pressable>
      <FlashList
        ref={listRef}
        horizontal
        data={positions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
      />
    </View>
  )
}
