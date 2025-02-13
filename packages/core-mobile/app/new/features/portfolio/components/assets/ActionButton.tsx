import React from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { SquareButton, SquareButtonIconType } from '@avalabs/k2-alpine'
import { getItemEnteringAnimation } from './consts'
import { ActionButtonTitle } from './consts'
import { useOnPressAnimation } from './useOnPressAnimation'

export type TActionButton = {
  title: ActionButtonTitle
  icon: SquareButtonIconType
}

type Props = {
  item: TActionButton
  index: number
}

export const ActionButton = ({ index, item }: Props): React.JSX.Element => {
  const { handleOnPressAnimation, animatedStyle } = useOnPressAnimation()

  const handleOnPress = (): void => {
    handleOnPressAnimation()

    switch (item.title) {
      case ActionButtonTitle.Bridge:
        // TODO: go to bridge
        break
      case ActionButtonTitle.Swap:
        // TODO: go to swap
        break
      case ActionButtonTitle.Send:
        // TODO: go to send
        break
      case ActionButtonTitle.Buy:
        // TODO: go to buy
        break
      case ActionButtonTitle.Connect:
        // TODO: go to connect
        break
    }
  }

  return (
    <Animated.View
      style={animatedStyle}
      entering={getItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <SquareButton
        key={index}
        title={item.title}
        icon={item.icon}
        onPress={handleOnPress}
      />
    </Animated.View>
  )
}
