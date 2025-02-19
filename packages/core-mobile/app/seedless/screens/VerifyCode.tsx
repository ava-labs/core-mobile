import { alpha, Text, TextInput, useTheme, View } from '@avalabs/k2-mobile'
import React, { useState } from 'react'
import { Space } from 'components/Space'
import Logger from 'utils/Logger'
import Loader from 'components/Loader'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Sheet } from 'components/Sheet'
import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'

export type VerifyCodeParams = {
  onVerifyCode: <T>(
    code: string
  ) => Promise<Result<CubeSignerResponse<T> | undefined, TotpErrors>>
  onVerifySuccess: <T>(cubeSignerResponse?: T) => void
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

  const handleVerifyCode = async (changedText: string): Promise<void> => {
    setCode(changedText)
    if (changedText.length < 6) {
      setShowError(false)
      return
    }

    setIsVerifying(true)

    try {
      const result = await onVerifyCode(changedText)
      if (result.success === false) {
        throw new Error(result.error.message)
      }
      setIsVerifying(false)
      onVerifySuccess(result.value?.data())
      AnalyticsService.capture('TotpValidationSuccess')
    } catch (error) {
      Logger.warn('handleVerifyCode', error)
      setShowError(true)
      setIsVerifying(false)
      AnalyticsService.capture('TotpValidationFailed', {
        error: error as string
      })
    }
  }

  const textInputStyle = showError
    ? {
        borderColor: '$dangerLight',
        borderWidth: 1
      }
    : undefined

  return (
    <Sheet onClose={onBack} title="Verify Code">
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
    </Sheet>
  )
}
