import { AnimatedPressable, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React, { memo } from 'react'
import Animated from 'react-native-reanimated'
import { HORIZONTAL_MARGIN, VERTICAL_ITEM_GAP } from '../consts'
import { CardContainer } from './CardContainer'

export const CollectiblesNone = memo((): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flex: 1,
        flexDirection: 'row',
        gap: HORIZONTAL_MARGIN,
        padding: HORIZONTAL_MARGIN,
        paddingTop: 0
      }}>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <AnimatedPressable entering={getListItemEnteringAnimation(0)}>
          <CardContainer
            style={{
              height: 220
            }}>
            <Icons.Content.Add
              color={colors.$textPrimary}
              width={40}
              height={40}
            />
          </CardContainer>
        </AnimatedPressable>

        <Animated.View entering={getListItemEnteringAnimation(1)}>
          <CardContainer
            style={{
              height: 180
            }}
          />
        </Animated.View>
      </View>
      <View
        style={{
          flex: 1,
          gap: VERTICAL_ITEM_GAP
        }}>
        <Animated.View entering={getListItemEnteringAnimation(2)}>
          <CardContainer
            style={{
              height: 190
            }}
          />
        </Animated.View>
        <Animated.View entering={getListItemEnteringAnimation(3)}>
          <CardContainer
            style={{
              height: 190
            }}
          />
        </Animated.View>
      </View>
    </View>
  )
})
