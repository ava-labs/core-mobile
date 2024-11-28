import { Dimensions, ImageSourcePropType } from 'react-native'
import React, { useState } from 'react'
import Carousel from 'react-native-reanimated-carousel'
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
        key={index}
        style={{ marginTop: index % 2 === 0 ? Configuration.avatarWidth : 0 }}
        onPressIn={() => handlePressIn(index)}
        onPressOut={() => handlePressOut(index)}
        onPress={() => handleSelect(index)}>
        <Avatar
          source={item}
          size={Configuration.avatarWidth}
          isSelected={selectedIndex === index}
          isPressed={pressedIndex === index}
        />
      </Pressable>
    )
  }

  return (
    <Carousel
      width={Configuration.avatarWidth / 2 + Configuration.spacing}
      height={Configuration.avatarWidth * 2}
      data={avatars}
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

export default AvatarList
