import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'

// Hello UI onboarding wizard footer (per Figma 1:2245).
//
// Layout: dots block on the left at 20dp inset, 46dp circular forward
// FAB on the right. The dots block has 5px gap between dots; each dot
// is 7×7 black at 40% opacity, except the active one which extends to
// 17×7 black solid.
//
// Step indices are zero-based.
export const OnboardingWizardFooter = ({
  currentStep,
  totalSteps,
  onNext,
  disabled,
  testID,
  style
}: {
  currentStep: number
  totalSteps: number
  onNext: () => void
  disabled?: boolean
  testID?: string
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        },
        style
      ]}>
      <OnboardingProgressDots
        currentStep={currentStep}
        totalSteps={totalSteps}
      />

      {/* Forward FAB — 46dp solid black circle with cream arrow. Sits at
          ~20dp from the right edge per Figma. */}
      <TouchableOpacity
        testID={testID ?? 'onboarding_wizard_next'}
        onPress={onNext}
        disabled={disabled}
        activeOpacity={0.7}
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: theme.colors.$inverseSurface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1
        }}>
        <Icons.Navigation.ArrowForwardIOS
          color={theme.colors.$inverseOnSurface}
          width={20}
          height={20}
        />
      </TouchableOpacity>
    </View>
  )
}

// Progress dots without the FAB — used on MFA screens (TOTP / FIDO
// authenticator subflow) where the screen has its own multi-action
// footer but we still want to show the user where they are in the
// flow.
export const OnboardingProgressDots = ({
  currentStep,
  totalSteps,
  style
}: {
  currentStep: number
  totalSteps: number
  style?: StyleProp<ViewStyle>
}): JSX.Element => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 8,
          paddingHorizontal: 12,
          alignSelf: 'flex-start'
        },
        style
      ]}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <Dot key={index} active={index === currentStep} />
      ))}
    </View>
  )
}

const Dot = ({ active }: { active: boolean }): JSX.Element => {
  const { theme } = useTheme()

  // Active dot extends from 7→17 width with a quick timing transition.
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 17 : 7, { duration: 220 }),
    opacity: withTiming(active ? 1 : 0.4, { duration: 220 })
  }))

  return (
    <Animated.View
      style={[
        {
          height: 7,
          borderRadius: 5,
          backgroundColor: theme.colors.$textPrimary
        },
        animatedStyle
      ]}
    />
  )
}
