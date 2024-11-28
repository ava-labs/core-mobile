import { FlatList, ImageSourcePropType, StyleSheet } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'
import Carousel from 'react-native-reanimated-carousel'
import { Pressable, View } from '../Primitives'
import { alpha } from '../../utils'
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
  const data: { bottom: ImageSourcePropType; top: ImageSourcePropType }[] =
    useMemo(() => {
      const pairs: { bottom: ImageSourcePropType; top: ImageSourcePropType }[] =
        []

      for (let i = 0; i < avatars.length - 1; i += 2) {
        pairs.push({
          bottom: avatars[i] as ImageSourcePropType,
          top: avatars[i + 1] as ImageSourcePropType
        })
      }

      return pairs
    }, [avatars])

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
    item: { bottom: ImageSourcePropType; top: ImageSourcePropType }
    index: number
  }): JSX.Element => {
    return (
      <View>
        <Pressable
          style={[
            styles.item,
            {
              marginLeft: -(
                Configuration.avatarWidth / 2 +
                Configuration.spacing
              ),
              zIndex: index * 2
              // transform: [
              //   {
              //     translateX:
              //       Configuration.avatarWidth / 2 + Configuration.spacing
              //   }
              // ]
            }
          ]}
          onPressIn={() => handlePressIn(index * 2)}
          onPressOut={() => handlePressOut(index * 2)}
          onPress={() => handleSelect(index * 2)}>
          <Avatar
            key={index * 2}
            source={item.top}
            size={Configuration.avatarWidth}
            isSelected={selectedIndex === index * 2}
            isPressed={pressedIndex === index * 2}
          />
        </Pressable>
        <Pressable
          style={[styles.item, styles.evenItem, { zIndex: index * 2 + 1 }]}
          onPressIn={() => handlePressIn(index * 2 + 1)}
          onPressOut={() => handlePressOut(index * 2 + 1)}
          onPress={() => handleSelect(index * 2 + 1)}>
          <Avatar
            key={index * 2 + 1}
            source={item.bottom}
            size={Configuration.avatarWidth}
            isSelected={selectedIndex === index * 2 + 1}
            isPressed={pressedIndex === index * 2 + 1}
          />
        </Pressable>
      </View>
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
    <Animated.View
      style={[
        fadeInAnimatedStyle,
        { paddingVertical: Configuration.spacing * 2 }
      ]}>
      <Carousel
        width={Configuration.avatarWidth + Configuration.spacing * 2}
        height={Configuration.avatarWidth * 2 + Configuration.spacing}
        data={data}
        renderItem={renderItem}
        pagingEnabled={false}
        snapEnabled={false}
        style={{ width: '100%', marginLeft: 40, overflow: 'visible' }}
      />
    </Animated.View>
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
    // paddingVertical: Configuration.spacing * 3,
    // paddingHorizontal: Configuration.avatarWidth / 2 - Configuration.spacing * 2
  },
  item: {
    // width: Configuration.avatarWidth / 2,
    // height: Configuration.avatarWidth,
    // marginHorizontal: Configuration.spacing - 2,
    // alignItems: 'center',
    // overflow: 'visible'
  },
  evenItem: {
    // marginTop: Configuration.avatarWidth - 1
  }
})

export default AvatarList
