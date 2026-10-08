import React, { useEffect, useState } from 'react'
import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

export const CollapsibleDetailGroup = ({
  label,
  verticalPadding,
  renderContent,
  isOpenByDefault = false
}: {
  label: string
  verticalPadding: number
  renderContent: () => React.ReactNode
  isOpenByDefault?: boolean
}): JSX.Element => {
  const [isOpen, setIsOpen] = useState(isOpenByDefault)

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        testID={`collapsible_group__${label}`}
        onPress={() => setIsOpen(open => !open)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: verticalPadding
        }}>
        <Text
          variant="buttonMedium"
          sx={{ fontSize: 16, lineHeight: 22, color: '$textPrimary' }}>
          {label}
        </Text>
        <Chevron isOpen={isOpen} />
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          {renderContent()}
        </Animated.View>
      )}
    </View>
  )
}

const Chevron = ({ isOpen }: { isOpen: boolean }): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const rotation = useSharedValue(isOpen ? 1 : 0)

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, { duration: 300 })
  }, [isOpen, rotation])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180 + 90}deg` }]
  }))

  return (
    <Animated.View style={[{ marginRight: -6 }, animatedStyle]}>
      <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
    </Animated.View>
  )
}
