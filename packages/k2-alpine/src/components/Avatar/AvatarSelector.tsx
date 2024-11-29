import { Dimensions, ImageSourcePropType } from 'react-native'
import React, { useMemo, useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
import { Pressable } from '../Primitives'
import { Avatar } from './Avatar'

const AvatarSelector = ({
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
    item: ImageSourcePropType
    index: number
  }): JSX.Element => {
    return (
      <Pressable
        key={index}
        style={{ marginTop: index % 2 === 0 ? Configuration.avatarWidth : 0 }}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        onPress={() => handleSelect(index)}>
        <Avatar
          source={item}
          size={Configuration.avatarWidth}
          isSelected={data[index]?.id === selectedId}
          isPressed={pressedIndex === index}
        />
      </Pressable>
    )
  }

  return (
    <Carousel
      width={Configuration.avatarWidth / 2 + Configuration.spacing}
      height={Configuration.avatarWidth * 2}
      data={data.map(avatar => avatar.source)}
      renderItem={renderItem}
      pagingEnabled={false}
      snapEnabled={false}
      style={{
        width: '100%',
        overflow: 'visible',
        paddingVertical: Configuration.spacing * 2,
        marginLeft: SCREEN_WIDTH / 2 - Configuration.avatarWidth / 2
      }}
    />
  )
}

export const Configuration = {
  avatarWidth: 90,
  spacing: 6
}

const SCREEN_WIDTH = Dimensions.get('window').width

export default AvatarSelector
