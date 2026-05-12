import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import {
  QUICK_SWAP_FEE_LEVELS,
  QuickSwapFeeLevel,
  selectQuickSwapsFeeSetting,
  setQuickSwapsFeeSetting
} from 'store/settings/advanced'

const TIER_LABEL: Record<QuickSwapFeeLevel, string> = {
  low: 'Slow',
  medium: 'Normal',
  high: 'Fast'
}

export const QuickSwapsFeePicker = (): React.JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const feeSetting = useSelector(selectQuickSwapsFeeSetting)

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{ gap: 4 }}>
      <View
        sx={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: theme.colors.$surfaceSecondary,
          gap: 10
        }}>
        <Text variant="body2" sx={{ fontSize: 16, lineHeight: 22 }}>
          Network fee settings
        </Text>
        <View sx={{ flexDirection: 'row', gap: 12 }}>
          {QUICK_SWAP_FEE_LEVELS.map(level => {
            const isSelected = feeSetting === level
            return (
              <Button
                type={isSelected ? 'primary' : 'secondary'}
                key={level}
                size="large"
                onPress={() => dispatch(setQuickSwapsFeeSetting(level))}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  alignItems: 'center'
                }}>
                <Text
                  sx={{
                    fontFamily: 'Inter-Medium',
                    color: isSelected
                      ? theme.colors.$surfacePrimary
                      : theme.colors.$textPrimary,
                    fontSize: 15,
                    lineHeight: 20,
                    textAlign: 'center'
                  }}>
                  {TIER_LABEL[level]}
                </Text>
              </Button>
            )
          })}
        </View>
      </View>
      <Text
        variant="caption"
        sx={{
          fontFamily: 'Inter-Medium',
          color: theme.colors.$textSecondary,
          paddingRight: 32
        }}>
        {`Set the default fee for quick swaps. Faster swaps require higher fees.`}
      </Text>
    </Animated.View>
  )
}
