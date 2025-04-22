import React, { useCallback, useMemo } from 'react'
import { Dimensions, ImageSourcePropType } from 'react-native'
import Carousel from 'react-native-reanimated-carousel'
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

  const renderItem = useCallback(
    ({
      item,
      index
    }: {
      item: { id: string; source: ImageSourcePropType }
      index: number
    }): JSX.Element => {
      const isSelected = item.id === selectedId
      return (
        <AnimatedPressable
          key={index}
          style={{ marginTop: index % 2 === 0 ? avatarWidth : 0 }}
          onPress={() => handleSelect(index)}>
          <Avatar
            source={item.source}
            size={avatarWidth}
            isSelected={isSelected}
            backgroundColor={'white'}
          />
        </AnimatedPressable>
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
      snapEnabled={false}
      pagingEnabled={false}
      defaultIndex={defaultIndex}
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
