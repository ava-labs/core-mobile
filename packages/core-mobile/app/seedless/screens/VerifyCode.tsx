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
import Loader from 'components/Loader'
import { useAnalytics } from 'hooks/useAnalytics'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { UserExportResponse } from 'seedless/types'

export type VerifyCodeParams = {
  onVerifyCode: (
    code: string
  ) => Promise<Result<UserExportResponse | void, TotpErrors>>
  onVerifySuccess: (cubeSignerResponse?: UserExportResponse) => void
  onBack: () => void
}

export const VerifyCode = ({
  onVerifyCode,
  onVerifySuccess,
  onBack
}: VerifyCodeParams): JSX.Element => {
  const {
    theme: { colors, text }
  } = useTheme()
  const [isVerifying, setIsVerifying] = useState(false)
  const [code, setCode] = useState<string>()
  const [showError, setShowError] = useState(false)
  const { capture } = useAnalytics()

  const handleVerifyCode = async (changedText: string): Promise<void> => {
    setCode(changedText)
    if (changedText.length < 6) {
      setShowError(false)
      return
    }

    setIsVerifying(true)

    try {
      const result = (await onVerifyCode(changedText)) as Result<
        UserExportResponse,
        TotpErrors
      >
      if (result.success === false) {
        throw new Error(result.error.message)
      }
      setIsVerifying(false)
      onVerifySuccess(result.value)
      capture('TotpValidationSuccess')
    } catch (error) {
      setShowError(true)
      setIsVerifying(false)
      capture('TotpValidationFailed', { error: error as string })
    }
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
        {isVerifying && (
          <View
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
            }}>
            <Loader transparent />
          </View>
        )}
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
            editable={!isVerifying}
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
