import {
  ActivityIndicator,
  Avatar,
  Button,
  Icons,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { selectSelectedAvatar } from 'store/settings/avatar'
import { isLimitedMode } from 'utils/limitedMode'

export const Confirmation = ({
  onNext
}: {
  onNext: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const avatar = useSelector(selectSelectedAvatar)

  const handleOnPress = useCallback((): void => {
    setIsLoading(true)
    setTimeout(() => {
      onNext()
    }, 100)
  }, [onNext])

  // Hello UI footer: shared wizard footer (left dots + forward FAB).
  // Mnemonic create flow has 6 steps; mnemonic recover and seedless
  // create both have 5. Confirmation is always the last step.
  const renderFooter = useCallback((): React.ReactNode => {
    if (isLimitedMode) {
      // Both 5- and 6-step flows want the FINAL dot extended; pinning
      // current=last and total=last+1 keeps the active dot at the right
      // edge. Total is wired by the screen above (recoveryFlow knows
      // its length); here we default to 5 since this component doesn't
      // know which flow it's part of, and 5 dots matches every limited
      // flow's "completion" frame in Figma.
      return (
        <OnboardingWizardFooter
          currentStep={4}
          totalSteps={5}
          onNext={handleOnPress}
          disabled={isLoading}
          testID="lets_go_btn"
        />
      )
    }
    return (
      <Button
        testID="lets_go_btn"
        size="large"
        type="primary"
        onPress={handleOnPress}
        disabled={isLoading}>
        {isLoading ? <ActivityIndicator /> : `Let's go!`}
      </Button>
    )
  }, [isLoading, handleOnPress])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        sx={{
          alignItems: 'center',
          flex: 1,
          gap: 32,
          justifyContent: 'center'
        }}>
        {isLimitedMode ? (
          /* Hello UI success state: solid teal circle with a white check.
             Replaces the avatar/glow that ships in the legacy flow. */
          <View
            sx={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '$textSuccess',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Icons.Navigation.Check color="#FFFFFF" width={40} height={40} />
          </View>
        ) : (
          avatar?.source && (
            <Avatar
              backgroundColor={colors.$surfacePrimary}
              source={avatar.source}
              size="large"
              hasBlur={Platform.OS === 'ios'}
              glowEffect={{
                imageSource: require('../../../../assets/glow.png'),
                size: 380,
                delay: 300
              }}
              testID="selected_avatar"
            />
          )
        )}
        <View
          sx={{
            paddingHorizontal: 12,
            maxWidth: 320,
            alignSelf: 'center'
          }}>
          <Text sx={{ textAlign: 'center' }} variant="heading3">
            {`That's it!\nEnjoy your wallet`}
          </Text>
          <Text
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              marginTop: 20
            }}>
            {isLimitedMode
              ? 'You can now start buying, swapping, sending, and receiving crypto'
              : 'You can now start buying, swapping, sending, receiving crypto and collectibles'}
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}
