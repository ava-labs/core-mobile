import React, { useCallback, useMemo } from 'react'
import { Dimensions, ImageSourcePropType } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import Carousel, { CarouselRenderItem } from 'react-native-reanimated-carousel'
import { isScreenSmall } from '../../utils'
import { AnimatedPressable } from '../Animated/AnimatedPressable'
import { Avatar } from './Avatar'

export const AvatarSelector = ({
  avatars,
  selectedId,
  onSelect
}: {
  avatars: { id: string; source: ImageSourcePropType }[]
  selectedId?: string
  onSelect?: (id: string) => void
}): JSX.Element => {
  const avatarWidth = isScreenSmall
    ? configuration.avatarWidth.small
    : configuration.avatarWidth.large

  const defaultIndex = useMemo(() => {
    const foundIndex = avatars.findIndex(item => item.id === selectedId)
    return foundIndex === -1 ? 0 : foundIndex
  }, [avatars, selectedId])

  const handleSelect = useCallback(
    (index: number): void => {
      const id = avatars[index]?.id
      if (id) {
        onSelect?.(id)
      }
    },
    [avatars, onSelect]
  )

  const renderItem: CarouselRenderItem<{
    id: string
    source: ImageSourcePropType
  }> = useCallback(
    ({ item, index }): JSX.Element => {
      const isSelected = item.id === selectedId

      return (
        <Animated.View
          key={`${item.source.toString()}-${index}`}
          entering={FadeIn.delay(index * 15)}
          style={{ marginTop: index % 2 === 0 ? avatarWidth : 0 }}>
          <AnimatedPressable
            onPress={() => handleSelect(index)}
            style={{
              flex: 1
            }}>
            <Avatar
              source={item.source}
              key={`${item.source.toString()}-${index}`}
              size={avatarWidth}
              isSelected={isSelected}
            />
          </AnimatedPressable>
        </Animated.View>
      )
    },
    [avatarWidth, handleSelect, selectedId]
  )

  return (
    <Carousel
      width={avatarWidth / 2 + configuration.spacing}
      height={avatarWidth * 2}
      data={avatars}
      renderItem={renderItem}
      defaultIndex={defaultIndex}
      snapEnabled={false}
      pagingEnabled={false}
      style={{
        width: '100%',
        overflow: 'visible',
        marginLeft: SCREEN_WIDTH / 2 - avatarWidth / 2
      }}
    />
  )
}

const configuration = {
  avatarWidth: {
    large: 90,
    small: 60
  },
  spacing: 6
}

const SCREEN_WIDTH = Dimensions.get('window').width
