import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { FC } from 'react'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessOnboardingAppleBlocked,
  selectIsSeedlessOnboardingGoogleBlocked
} from 'store/posthog'
import SocialButton from './SocialButton'

type Props = {
  title: string
  disabled?: boolean
  onGoogleAction: () => void
  onAppleAction: () => void
  onMnemonicAction: () => void
}

const AuthButtons: FC<Props> = ({
  title,
  disabled,
  onGoogleAction,
  onAppleAction,
  onMnemonicAction
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const isSeedlessOnboardingAppleBlocked = useSelector(
    selectIsSeedlessOnboardingAppleBlocked
  )
  const isSeedlessOnboardingGoogleBlocked = useSelector(
    selectIsSeedlessOnboardingGoogleBlocked
  )

  const shouldShowGoogle = !isSeedlessOnboardingGoogleBlocked
  const shouldShowApple =
    !isSeedlessOnboardingAppleBlocked && AppleSignInService.isSupported()
  const shouldShowSpace = shouldShowGoogle && shouldShowApple

  return (
    <View>
      <View sx={{ alignItems: 'center', marginBottom: 16 }}>
        <Text variant="alertTitle">{title}</Text>
        <Space y={16} />
        <View sx={{ flexDirection: 'row' }}>
          {shouldShowGoogle && (
            <>
              <SocialButton
                type="google"
                disabled={disabled}
                onPress={onGoogleAction}
              />
            </>
          )}
          {shouldShowSpace && <Space x={16} />}
          {shouldShowApple && (
            <SocialButton
              type="apple"
              disabled={disabled}
              onPress={onAppleAction}
            />
          )}
        </View>
        <Space y={16} />
        <View
          sx={{
            paddingHorizontal: 28,
            flexDirection: 'row',
            width: '100%',
            alignItems: 'center'
          }}>
          <Separator color={colors.$neutral850} style={{ flexGrow: 1 }} />
          <Text style={{ marginHorizontal: 16 }} variant="alertTitle">
            or
          </Text>
          <Separator color={colors.$neutral850} style={{ flexGrow: 1 }} />
        </View>
      </View>
      <Button
        type="secondary"
        size="xlarge"
        disabled={disabled}
        onPress={onMnemonicAction}>
        Recovery Phrase
      </Button>
    </View>
  )
}

export default AuthButtons
