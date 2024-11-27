import { FlatList, ImageSourcePropType, StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import { Pressable } from '../Primitives'
import { Avatar } from './Avatar'

const AvatarList = ({
  avatars,
  selectedIndex,
  onSelect
}: {
  avatars: ImageSourcePropType[]
  selectedIndex?: number
  onSelect?: (index: number) => void
}): JSX.Element => {
  const [pressedIndex, setPressedIndex] = useState<number>()
  const [isCentered, setIsCentered] = useState<boolean>(false)

  const handlePressIn = (index: number): void => {
    setPressedIndex(index)
  }

  const handlePressOut = (index: number): void => {
    if (pressedIndex === index) {
      setPressedIndex(undefined)
    }
  }

  const handleSelect = (index: number): void => {
    onSelect?.(index)
  }

  const renderItem = ({
    item,
    index
  }: {
    item: ImageSourcePropType
    index: number
  }): JSX.Element => {
    return (
      <Pressable
        style={[styles.item, index % 2 === 0 && styles.evenItem]}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        onPress={() => handleSelect(index)}>
        <Avatar
          key={index}
          source={item}
          size={Configuration.avatarWidth}
          isSelected={selectedIndex === index}
          isPressed={pressedIndex === index}
        />
      </Pressable>
    )
  }

  const handleScrollToIndexFailed = (): void => {
    setTimeout(() => {
      scrollToInitialPosition()
    }, 100)
  }

  const scrollToInitialPosition = useCallback(() => {
    if (
      avatars.length >= Configuration.minimumAvatarsForCentering &&
      !isCentered
    ) {
      ref.current?.scrollToIndex({ index: 4, viewPosition: 0.5 })
      setIsCentered(true)
    }
  }, [avatars, isCentered])

  const ref = useRef<FlatList>(null)

  const fadeInAnimation = useSharedValue(0)
  const fadeInAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeInAnimation.value
  }))
  useEffect(() => {
    if (isCentered) {
      fadeInAnimation.value = withDelay(
        400,
        withTiming(1, {
          duration: 200
        })
      )
    }
  }, [fadeInAnimation, isCentered])

  useEffect(() => {
    scrollToInitialPosition()
  }, [scrollToInitialPosition])

  useEffect(() => {
    if (avatars.length < Configuration.minimumAvatarsForCentering) {
      setIsCentered(true)
    }
  }, [avatars])

  return (
    <Animated.FlatList
      style={[fadeInAnimatedStyle]}
      ref={ref}
      data={avatars}
      keyExtractor={(_, index) => index.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={renderItem}
      onScrollToIndexFailed={handleScrollToIndexFailed}
    />
  )
}

export const Configuration = {
  avatarWidth: 90,
  spacing: 5,
  defaultCenterIndex: 5,
  minimumAvatarsForCentering: 9
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Configuration.spacing * 3,
    paddingHorizontal: Configuration.avatarWidth / 2 - Configuration.spacing * 2
  },
  item: {
    width: Configuration.avatarWidth / 2,
    height: Configuration.avatarWidth,
    marginHorizontal: Configuration.spacing - 2,
    alignItems: 'center',
    overflow: 'visible'
  },
  evenItem: {
    marginTop: Configuration.avatarWidth - 1
  },
  avatar: {
    width: Configuration.avatarWidth - Configuration.spacing * 2,
    height: Configuration.avatarWidth - Configuration.spacing * 2,
    borderRadius: Configuration.avatarWidth / 2
  }
})

export default AvatarList
