import { AnimatedPressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import Animated, { type ReanimatedKeyframe } from 'react-native-reanimated'

const CARD_WIDTH = 160
const CARD_HEIGHT = 240

const MoreNavigationCard = ({
  item,
  isOpen,
  entering,
  exiting
}: {
  item: {
    title: string
    onPress: () => void
  }
  isOpen: boolean
  entering: ReanimatedKeyframe
  exiting: ReanimatedKeyframe
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      }}>
      {isOpen && (
        <AnimatedPressable
          onPress={item.onPress}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 16
          }}>
          <Animated.View
            entering={entering}
            exiting={exiting}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              backgroundColor: theme.colors.$textPrimary,
              overflow: 'hidden',
              transformOrigin: 'left bottom',
              padding: 16
            }}>
            <Text
              variant="heading4"
              style={{ color: theme.colors.$surfacePrimary }}>
              {item.title}
            </Text>
          </Animated.View>
        </AnimatedPressable>
      )}
    </View>
  )
}

export { MoreNavigationCard, CARD_WIDTH, CARD_HEIGHT }
