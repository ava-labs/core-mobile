import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  ImageSourcePropType,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { FlatList } from 'react-native-gesture-handler'
import { SvgProps } from 'react-native-svg'
import { ANIMATED, isScreenSmall } from '../../utils'
import { AnimatedPressable } from '../Animated/AnimatedPressable'
import { View } from '../Primitives'
import { Avatar } from './Avatar'

export const AvatarSelector = ({
  avatars,
  selectedId,
  onSelect
}: {
  avatars: { id: string; source: ImageSourcePropType | React.FC<SvgProps> }[]
  selectedId?: string
  onSelect?: (id: string) => void
}): JSX.Element => {
  const avatarWidth = isScreenSmall
    ? configuration.avatarWidth.small
    : configuration.avatarWidth.large

  const flatListRef = useRef<FlatList>(null)
  const hasScrolledToSelected = useRef(false)
  const targetOffsetRef = useRef<number | null>(null)
  const [isReady, setIsReady] = useState(!selectedId)
  const opacity = useSharedValue(isReady ? 1 : 0)

  const handleSelect = useCallback(
    (index: number): void => {
      const id = avatars[index]?.id
      if (id) {
        onSelect?.(id)
      }
    },
    [avatars, onSelect]
  )

  const gap = useMemo(
    () => avatarWidth / 2 - configuration.spacing / 2,
    [avatarWidth]
  )

  // Each item's effective width (accounting for negative margins)
  const itemWidth = useMemo(() => avatarWidth - gap, [avatarWidth, gap])

  // Provide exact layout info so scrollToOffset works reliably
  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: itemWidth,
      offset: itemWidth * index,
      index
    }),
    [itemWidth]
  )

  const renderItem: ListRenderItem<{
    id: string
    source: ImageSourcePropType | React.FC<SvgProps>
  }> = useCallback(
    ({
      item,
      index
    }: {
      item: { id: string; source: ImageSourcePropType | React.FC<SvgProps> }
      index: number
    }): JSX.Element => {
      const isSelected = item?.id === selectedId

      return (
        <View
          style={{
            width: avatarWidth,
            height: avatarWidth,
            marginRight: -gap / 2,
            marginLeft: -gap / 2,
            zIndex: index % 2 === 0 ? 0 : 1
          }}>
          <AnimatedPressable
            onPress={() => handleSelect(index)}
            style={{
              top: index % 2 === 0 ? avatarWidth : configuration.spacing,
              position: 'absolute'
            }}>
            <Avatar
              source={item?.source}
              size={avatarWidth}
              isSelected={isSelected}
            />
          </AnimatedPressable>
        </View>
      )
    },
    [avatarWidth, handleSelect, gap, selectedId]
  )

  const contentOffset = useMemo(() => {
    return {
      x:
        (avatars.length * gap -
          avatarWidth +
          (Platform.OS === 'ios' ? (isScreenSmall ? 6 : 26) : 22)) /
        2,
      y: 0
    }
  }, [avatarWidth, avatars.length, gap])

  // Calculate the target offset to center the selected avatar
  const calculateTargetOffset = useCallback(
    (selectedIndex: number) => {
      const screenWidth = Dimensions.get('window').width
      const contentPadding = gap - configuration.spacing * 2
      // Position of the center of the selected item in content coordinates
      const itemCenter =
        contentPadding + selectedIndex * itemWidth + itemWidth / 2
      // Offset needed to center that item on screen
      return Math.max(0, itemCenter - screenWidth / 2)
    },
    [gap, itemWidth]
  )

  // Handle scroll events to detect when we've reached the target
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (targetOffsetRef.current === null || hasScrolledToSelected.current) {
        return
      }

      const currentOffset = event.nativeEvent.contentOffset.x
      // Check if we're close enough to the target (within 2px)
      if (Math.abs(currentOffset - targetOffsetRef.current) <= 2) {
        hasScrolledToSelected.current = true
        targetOffsetRef.current = null
        setIsReady(true)
      }
    },
    []
  )

  // Scroll to selected avatar after initial render
  useEffect(() => {
    if (!selectedId) {
      setIsReady(true)
      return
    }

    if (!hasScrolledToSelected.current && flatListRef.current) {
      const selectedIndex = avatars.findIndex(
        avatar => avatar.id === selectedId
      )
      if (selectedIndex >= 0) {
        const targetOffset = calculateTargetOffset(selectedIndex)
        targetOffsetRef.current = targetOffset

        // Small delay to ensure FlatList is fully mounted
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: targetOffset,
            animated: false
          })

          // Fallback: if onScroll doesn't fire (already at position), reveal after delay
          setTimeout(() => {
            if (!hasScrolledToSelected.current) {
              hasScrolledToSelected.current = true
              targetOffsetRef.current = null
              setIsReady(true)
            }
          }, 100)
        }, 50)
      } else {
        setIsReady(true)
      }
    }
  }, [selectedId, avatars, calculateTargetOffset])

  // Animate fade when ready
  useEffect(() => {
    if (isReady) {
      opacity.value = withTiming(1, ANIMATED.TIMING_CONFIG)
    }
  }, [isReady, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  return (
    <Animated.View style={animatedStyle}>
      <FlatList
        ref={flatListRef}
        data={avatars}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        windowSize={7}
        contentOffset={contentOffset}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={50}
        keyExtractor={item => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: gap - configuration.spacing * 2
        }}
        style={{
          height: avatarWidth * 2
        }}
      />
    </Animated.View>
  )
}

const configuration = {
  avatarWidth: {
    large: 90,
    small: 60
  },
  spacing: 6
}
