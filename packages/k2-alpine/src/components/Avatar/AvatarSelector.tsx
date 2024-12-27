import { Dimensions, ImageSourcePropType } from 'react-native'
import React, { useMemo, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { Pressable } from '../Primitives'
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
        style={{ marginTop: index % 2 === 0 ? configuration.avatarWidth : 0 }}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        onPress={() => handleSelect(index)}>
        <Avatar
          source={item.source}
          size={configuration.avatarWidth}
          isSelected={data[index]?.id === selectedId}
          isPressed={pressedIndex === index}
          backgroundColor={'white'}
        />
      </Pressable>
    )
  }

  return (
    <Carousel
      width={configuration.avatarWidth / 2 + configuration.spacing}
      height={configuration.avatarWidth * 2}
      data={data}
      renderItem={renderItem}
      pagingEnabled={false}
      snapEnabled={false}
      style={{
        width: '100%',
        overflow: 'visible',
        paddingVertical: configuration.spacing * 2,
        marginLeft: SCREEN_WIDTH / 2 - configuration.avatarWidth / 2
      }}
    />
  )
}

const configuration = {
  avatarWidth: 90,
  spacing: 6
}

const SCREEN_WIDTH = Dimensions.get('window').width
