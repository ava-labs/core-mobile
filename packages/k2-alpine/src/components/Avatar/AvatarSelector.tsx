import { Dimensions, ImageSourcePropType } from 'react-native'
import React, { useMemo, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { Pressable } from '../Primitives'
import { isScreenSmall } from '../../utils'
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
  const data = useMemo(() => {
    // we should always have an even number of avatars, due to infinite scrolling + two avatars per column
    if (avatars.length % 2 === 0) {
      return avatars
    } else {
      return [...avatars, ...avatars]
    }
  }, [avatars])
  const [pressedIndex, setPressedIndex] = useState<number>()
  const avatarWidth = isScreenSmall
    ? configuration.avatarWidth.small
    : configuration.avatarWidth.large

  const handlePressIn = (index: number): void => {
    setPressedIndex(index)
  }

  const handlePressOut = (index: number): void => {
    if (pressedIndex === index) {
      setPressedIndex(undefined)
    }
  }

  const handleSelect = (index: number): void => {
    if (data[index]?.id === undefined) {
      return
    }

    onSelect?.(data[index].id)
  }

  const renderItem = ({
    item,
    index
  }: {
    item: { id: string; source: ImageSourcePropType }
    index: number
  }): JSX.Element => {
    return (
      <Pressable
        key={index}
        style={{ marginTop: index % 2 === 0 ? avatarWidth : 0 }}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        onPress={() => handleSelect(index)}>
        <Avatar
          source={item.source}
          size={avatarWidth}
          isSelected={data[index]?.id === selectedId}
          isPressed={pressedIndex === index}
          backgroundColor={'white'}
        />
      </Pressable>
    )
  }

  return (
    <Carousel
      width={avatarWidth / 2 + configuration.spacing}
      height={avatarWidth * 2}
      data={data}
      renderItem={renderItem}
      pagingEnabled={false}
      snapEnabled={false}
      style={{
        width: '100%',
        overflow: 'visible',
        paddingVertical: configuration.spacing * 2,
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
