import React from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { SquareButton, SquareButtonIconType } from '@avalabs/k2-alpine'
import { getItemEnteringAnimation } from 'common/utils/animations'
import { ActionButtonTitle } from '../consts'

export const ActionButtons = ({
  buttons
}: {
  buttons: ActionButton[]
}): JSX.Element => {
  const renderActionItem = (item: ActionButton, index: number): JSX.Element => {
    return (
      <Animated.View
        entering={getItemEnteringAnimation(index)}
        layout={LinearTransition.springify()}>
        <SquareButton
          key={index}
          title={item.title}
          icon={item.icon}
          onPress={item.onPress}
        />
      </Animated.View>
    )
  }

  return (
    <Animated.FlatList
      style={{ overflow: 'visible' }}
      contentContainerStyle={{ gap: 10 }}
      horizontal
      scrollEventThrottle={16}
      data={buttons}
      renderItem={item => renderActionItem(item.item, item.index)}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
    />
  )
}

export type ActionButton = {
  title: ActionButtonTitle
  icon: SquareButtonIconType
  onPress: () => void
}
