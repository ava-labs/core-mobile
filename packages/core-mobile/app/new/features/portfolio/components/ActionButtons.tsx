import React from 'react'
import Animated, { LinearTransition } from 'react-native-reanimated'
import {
  SquareButton,
  SquareButtonIconType,
  useTheme
} from '@avalabs/k2-alpine'
import { useOnPressAnimation } from './assets/useOnPressAnimation'
import { ActionButtonTitle, getItemEnteringAnimation } from './assets/consts'

export const ActionButtons = ({
  buttons
}: {
  buttons: ActionButton[]
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { animatedStyle } = useOnPressAnimation()

  const renderActionItem = (item: ActionButton, index: number): JSX.Element => {
    return (
      <Animated.View
        style={animatedStyle}
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
      style={{ overflow: 'visible', backgroundColor: colors.$surfacePrimary }}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
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
