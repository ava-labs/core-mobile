import {
  alpha,
  Pressable,
  Text,
  TextInput,
  useTheme,
  View
} from '@avalabs/k2-mobile'
import React, { useState } from 'react'
import { BottomSheet } from 'components/BottomSheet'
import ClearSVG from 'components/svg/ClearSVG'
import { Space } from 'components/Space'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'

export type VerifyCodeParams = {
  oidcToken: string
  mfaId: string
  onVerifySuccess: () => void
  onBack: () => void
}

export const VerifyCode = ({
  oidcToken,
  mfaId,
  onVerifySuccess,
  onBack
}: VerifyCodeParams): JSX.Element => {
  const {
    theme: { colors, text }
  } = useTheme()
  const [code, setCode] = useState<string>()

  const [showError, setShowError] = useState(false)

  const handleVerifyCode = async (changedText: string): Promise<void> => {
    setCode(changedText)
    if (changedText.length < 6) {
      setShowError(false)
      return
    }
    const result = await SeedlessService.verifyCode(
      oidcToken,
      mfaId,
      changedText
    )
    if (result.success === false) {
      setShowError(true)
      return
    }
    onVerifySuccess()
  }

  const textInputStyle = showError
    ? {
        borderColor: '$dangerLight',
        borderWidth: 1
      }
    : undefined

  return (
    <BottomSheet snapPoints={['99%']}>
      <View
        sx={{ marginHorizontal: 16, justifyContent: 'space-between', flex: 1 }}>
        <View>
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Text variant="heading4">VerifyCode</Text>
            <Pressable onPress={onBack}>
              <ClearSVG
                backgroundColor={alpha(colors.$neutral700, 0.5)}
                color={colors.$neutral500}
                size={30}
              />
            </Pressable>
          </View>
          <Space y={24} />
          <Text variant="body1">
            Enter the code generated from your authenticator app.
          </Text>
          <Space y={24} />
          <TextInput
            onChangeText={changedText => {
              handleVerifyCode(changedText).catch(error =>
                Logger.error('handleVerifyCode', error)
              )
            }}
            keyboardType="number-pad"
            keyboardAppearance="dark"
            multiline
            value={code}
            sx={{
              height: 116,
              backgroundColor: alpha(colors.$neutral700, 0.5),
              borderColor: '$dangerLight',
              borderRadius: 8,
              color: '$neutral50',
              padding: 8,
              ...text.heading3,
              ...textInputStyle
            }}
          />
          {showError && (
            <Text
              variant="helperText"
              sx={{ color: '$dangerLight', marginTop: 8 }}>
              Incorrect code. Try again.
            </Text>
          )}
        </View>
      </View>
    </BottomSheet>
  )
}
